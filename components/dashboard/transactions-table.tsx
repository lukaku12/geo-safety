"use client";

import { TransactionStatusBadge } from "@/components/dashboard/status-badges";
import { SortHeader } from "@/components/dashboard/table-controls";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { Transaction } from "@/lib/types/domain";
import type { UseDashboardParams } from "@/hooks/use-dashboard-params";
import { formatCurrency, formatDate } from "@/lib/utils/format";

type SortField = UseDashboardParams["query"]["sort"];

export function TransactionsTable({
  transactions,
  sort,
  order,
  onToggleSort,
  onSelect,
}: {
  transactions: Transaction[];
  sort: SortField;
  order: "asc" | "desc";
  onToggleSort: (field: SortField) => void;
  onSelect: (transaction: Transaction) => void;
}) {
  return (
    // The scroll container lives in the parent panel; header cells stick to
    // its top. The bottom rule is an inset shadow because collapsed-table
    // borders don't travel with sticky cells.
    <table className="w-full text-sm [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-card [&_th]:shadow-[inset_0_-1px_0_var(--border)]">
      <thead>
        <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
          <SortHeader
            label="Date"
            field="entry_date"
            active={sort === "entry_date"}
            order={order}
            onToggle={onToggleSort}
          />
          <SortHeader
            label="Sender"
            field="sender_name"
            active={sort === "sender_name"}
            order={order}
            onToggle={onToggleSort}
          />
          <th scope="col" className="px-4 py-3 font-medium">Purpose</th>
          <SortHeader
            label="Amount"
            field="amount"
            active={sort === "amount"}
            order={order}
            onToggle={onToggleSort}
            align="right"
          />
          <SortHeader
            label="Status"
            field="status"
            active={sort === "status"}
            order={order}
            onToggle={onToggleSort}
          />
          <th scope="col" className="px-4 py-3 font-medium">Matched company</th>
          <th scope="col" className="px-4 py-3 text-right font-medium">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((txn) => (
          <tr
            key={txn.id}
            className={cn(
              "border-b border-border transition-colors duration-150 last:border-0",
              // Unmatched rows are the worklist — a soft tint plus a left
              // accent flags them before the reader parses the badge column.
              txn.status === "unmatched"
                ? "bg-danger-soft/60 hover:bg-danger-soft [&>td:first-child]:shadow-[inset_3px_0_0_var(--danger)]"
                : "hover:bg-surface-muted/60",
            )}
          >
            <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
              {formatDate(txn.entryDate)}
            </td>
            <td className="px-4 py-3">
              <div className="font-medium">{txn.senderName ?? "—"}</div>
              <div className="font-mono text-xs text-muted-foreground">
                {txn.senderInn ?? "no INN"}
              </div>
            </td>
            <td className="max-w-xs px-4 py-3">
              <span className="line-clamp-2 text-muted-foreground">
                {txn.purpose ?? "—"}
              </span>
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">
              {formatCurrency(txn.amount, txn.currency)}
            </td>
            <td className="px-4 py-3">
              <TransactionStatusBadge status={txn.status} />
            </td>
            <td className="px-4 py-3">
              {txn.matchedCompany ? (
                <span className="font-medium">{txn.matchedCompany.name}</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </td>
            <td className="px-4 py-3 text-right">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onSelect(txn)}
              >
                Review
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
