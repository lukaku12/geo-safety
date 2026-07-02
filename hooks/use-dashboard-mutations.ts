"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api, ApiClientError } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";
import { useToast } from "@/components/ui/toast";
import type { Company, Paginated, Transaction } from "@/lib/types/domain";
import type { UpdateTransactionInput } from "@/lib/validation/transactions";

/** Human-readable reason from an API error, falling back to a generic line. */
function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? error.message : fallback;
}

/** Run the INN auto-match, then refresh every dashboard query. */
export function useRunReconciliation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => api.runReconciliation(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      toast({
        tone: "success",
        title: "Auto-match complete",
        description: `Matched ${result.matchedCount} • ${result.unmatchedCount} still unmatched.`,
      });
    },
    onError: (error) => {
      toast({
        tone: "error",
        title: "Auto-match failed",
        description: errorMessage(error, "Please try again."),
      });
    },
  });
}

/** Restore the seeded state (all transactions unmatched), then refresh. */
export function useResetReconciliation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => api.resetReconciliation(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      toast({
        tone: "success",
        title: "Database reset",
        description: `Restored ${result.resetCount} transaction${
          result.resetCount === 1 ? "" : "s"
        } to the seeded state.`,
      });
    },
    onError: (error) => {
      toast({
        tone: "error",
        title: "Reset failed",
        description: errorMessage(error, "Please try again."),
      });
    },
  });
}

/** Compute the optimistic row for an action without waiting for the server. */
function applyOptimistic(
  txn: Transaction,
  input: UpdateTransactionInput,
  companies: Company[] | undefined,
): Transaction {
  if (input.action === "match") {
    const company = companies?.find((c) => c.id === input.companyId) ?? null;
    return {
      ...txn,
      status: "matched",
      matchMethod: "manual",
      matchConfidence: 1,
      matchedCompany: company
        ? { id: company.id, name: company.name, taxId: company.taxId }
        : txn.matchedCompany,
    };
  }

  return {
    ...txn,
    status: input.action === "ignore" ? "ignored" : "unmatched",
    matchMethod: null,
    matchConfidence: null,
    matchedCompany: null,
  };
}

interface UpdateVars {
  id: string;
  input: UpdateTransactionInput;
}

/**
 * Manual match / ignore / unmatch with an optimistic update across every cached
 * transaction page, rollback on error, and a full invalidation on settle so the
 * stats and per-company views reconcile with server truth.
 */
const ACTION_SUCCESS: Record<UpdateTransactionInput["action"], string> = {
  match: "Transaction matched",
  ignore: "Transaction ignored",
  unmatch: "Match removed",
};

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, input }: UpdateVars) => api.updateTransaction(id, input),

    onMutate: async ({ id, input }: UpdateVars) => {
      await queryClient.cancelQueries({ queryKey: keys.transactions() });

      const snapshots = queryClient.getQueriesData<Paginated<Transaction>>({
        queryKey: keys.transactions(),
      });
      const companies = queryClient.getQueryData<Company[]>(keys.companies());

      for (const [key, data] of snapshots) {
        if (!data) continue;
        queryClient.setQueryData<Paginated<Transaction>>(key, {
          ...data,
          items: data.items.map((txn) =>
            txn.id === id ? applyOptimistic(txn, input, companies) : txn,
          ),
        });
      }

      return { snapshots };
    },

    onError: (error, { input }, context) => {
      context?.snapshots.forEach(([key, data]) =>
        queryClient.setQueryData(key, data),
      );
      toast({
        tone: "error",
        title: "Couldn't update transaction",
        description: errorMessage(error, `Failed to ${input.action}.`),
      });
    },

    onSuccess: (_data, { input }) => {
      toast({ tone: "success", title: ACTION_SUCCESS[input.action] });
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  });
}
