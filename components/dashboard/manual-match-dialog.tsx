"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { TransactionStatusBadge } from "@/components/dashboard/status-badges";
import { useCompanyOptions } from "@/hooks/use-dashboard-queries";
import { useUpdateTransaction } from "@/hooks/use-dashboard-mutations";
import { suggestCompany } from "@/lib/reconciliation/suggest";
import type { Transaction } from "@/lib/types/domain";
import type { UpdateTransactionInput } from "@/lib/validation/transactions";
import { formatCurrency, formatDate } from "@/lib/utils/format";

const SUGGESTION_REASONS = {
  inn: "the sender INN equals this company's tax ID",
  name: "the sender name resembles this company",
} as const;

export function ManualMatchDialog({
  transaction,
  onClose,
}: {
  transaction: Transaction;
  onClose: () => void;
}) {
  const { data: companies, isPending: companiesLoading } = useCompanyOptions();
  const update = useUpdateTransaction();

  // null = untouched by the user, so the suggestion (once companies load) can
  // drive the select without any state syncing; "" = explicitly cleared.
  const [companyId, setCompanyId] = useState<string | null>(
    transaction.matchedCompany?.id ?? null,
  );

  const suggestion = useMemo(
    () => (companies ? suggestCompany(transaction, companies) : null),
    [companies, transaction],
  );
  const selectedId = companyId ?? suggestion?.company.id ?? "";
  const showSuggestionHint =
    suggestion !== null &&
    selectedId === suggestion.company.id &&
    transaction.matchedCompany?.id !== selectedId;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const apply = (input: UpdateTransactionInput) => {
    update.mutate(
      { id: transaction.id, input },
      { onSuccess: onClose },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Match transaction"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border p-5">
          <div>
            <h2 className="text-base font-semibold">Reconcile transaction</h2>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {transaction.docKey}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground hover:bg-surface-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">Sender</dt>
              <dd className="font-medium">
                {transaction.senderName ?? "—"}{" "}
                <span className="font-mono text-xs text-muted-foreground">
                  {transaction.senderInn ?? "no INN"}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Amount</dt>
              <dd className="font-medium tabular-nums">
                {formatCurrency(transaction.amount, transaction.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Date</dt>
              <dd className="font-medium">{formatDate(transaction.entryDate)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">Purpose</dt>
              <dd className="text-sm">{transaction.purpose ?? "—"}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">Current status</dt>
              <dd className="mt-1">
                <TransactionStatusBadge status={transaction.status} />
              </dd>
            </div>
          </dl>

          <div className="space-y-1.5">
            <label htmlFor="company" className="text-sm font-medium">
              Assign to company
            </label>
            <Select
              id="company"
              className="w-full"
              value={selectedId}
              disabled={companiesLoading}
              onChange={(e) => setCompanyId(e.target.value)}
            >
              <option value="">Select a company…</option>
              {companies?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.taxId})
                </option>
              ))}
            </Select>
            {showSuggestionHint ? (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
                Suggested match — {SUGGESTION_REASONS[suggestion.reason]}.
              </p>
            ) : null}
          </div>

          {update.isError ? (
            <p className="text-sm text-danger">
              {update.error instanceof Error
                ? update.error.message
                : "Update failed"}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border p-5">
          <div className="flex gap-2">
            {transaction.status !== "ignored" ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={update.isPending}
                onClick={() => apply({ action: "ignore" })}
              >
                Ignore
              </Button>
            ) : null}
            {transaction.status !== "unmatched" ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={update.isPending}
                onClick={() => apply({ action: "unmatch" })}
              >
                Reset
              </Button>
            ) : null}
          </div>
          <Button
            size="sm"
            disabled={!selectedId || update.isPending}
            onClick={() => apply({ action: "match", companyId: selectedId })}
          >
            {update.isPending ? "Saving…" : "Match company"}
          </Button>
        </div>
      </div>
    </div>
  );
}
