"use client";

import { TransactionStatusBadge } from "@/components/dashboard/status-badges";
import { SortHeader } from "@/components/dashboard/table-controls";
import { Button } from "@/components/ui/button";
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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
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
            <th className="px-4 py-3 font-medium">Purpose</th>
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
            <th className="px-4 py-3 font-medium">Matched company</th>
            <th className="px-4 py-3 text-right font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => (
            <tr
              key={txn.id}
              className="border-b border-border last:border-0 hover:bg-surface-muted/60"
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
    </div>
  );
}
