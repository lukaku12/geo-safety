"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";
import type { Company, Paginated, Transaction } from "@/lib/types/domain";
import type { UpdateTransactionInput } from "@/lib/validation/transactions";

/** Run the INN auto-match, then refresh every dashboard query. */
export function useRunReconciliation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.runReconciliation(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
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
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

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

    onError: (_error, _vars, context) => {
      context?.snapshots.forEach(([key, data]) =>
        queryClient.setQueryData(key, data),
      );
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  });
}
