"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { TransactionFilters } from "@/components/dashboard/transaction-filters";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { ManualMatchDialog } from "@/components/dashboard/manual-match-dialog";
import { PaginationBar } from "@/components/dashboard/table-controls";
import {
  PaginationBarSkeleton,
  TableSkeleton,
} from "@/components/dashboard/page-skeleton";
import { useTransactions } from "@/hooks/use-dashboard-queries";
import type { UseDashboardParams } from "@/hooks/use-dashboard-params";
import type { Transaction } from "@/lib/types/domain";
import { cn } from "@/lib/utils/cn";

export function TransactionsPanel({
  query,
  patch,
  toggleSort,
}: {
  query: UseDashboardParams["query"];
  patch: UseDashboardParams["patch"];
  toggleSort: UseDashboardParams["toggleSort"];
}) {
  const { data, isPending, isError, isPlaceholderData, refetch } =
    useTransactions(query);
  const [selected, setSelected] = useState<Transaction | null>(null);

  return (
    // h-full + min-h-0 down the chain: the page fits the viewport exactly and
    // only the table region scrolls (both axes) — never the document.
    <section className="flex h-full min-h-0 flex-col gap-4">
      <div className="shrink-0">
        <h2 className="text-lg font-semibold">Transactions</h2>
        <p className="text-sm text-muted-foreground">
          Review incoming transfers and reconcile them with companies.
        </p>
      </div>

      <TransactionFilters query={query} patch={patch} />

      {/* min-h-40 floor: on absurdly short viewports the page degrades to
          scrolling inside <main> instead of crushing the table to nothing. */}
      <Card className="flex min-h-40 flex-1 flex-col overflow-hidden">
        {isError ? (
          <ErrorState
            className="border-0"
            description="Couldn't load transactions."
            action={
              <button
                type="button"
                onClick={() => refetch()}
                className="text-sm font-medium text-danger underline"
              >
                Retry
              </button>
            }
          />
        ) : isPending ? (
          <TableSkeleton />
        ) : data.items.length === 0 ? (
          <EmptyState
            className="border-0"
            title="No transactions match"
            description="Try clearing the search or switching status filters."
          />
        ) : (
          <div
            className={cn(
              "min-h-0 flex-1 overflow-auto",
              isPlaceholderData && "opacity-60 transition-opacity",
            )}
          >
            <TransactionsTable
              transactions={data.items}
              sort={query.sort}
              order={query.order}
              onToggleSort={toggleSort}
              onSelect={setSelected}
            />
          </div>
        )}
      </Card>

      {data && data.items.length > 0 ? (
        <PaginationBar
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          totalPages={data.totalPages}
          itemLabel="transaction"
          onPageChange={(page) => patch({ page })}
          onPageSizeChange={(pageSize) => patch({ pageSize })}
        />
      ) : isPending ? (
        // Reserve the pagination row so the table card doesn't jump when data
        // lands.
        <PaginationBarSkeleton />
      ) : null}

      {selected ? (
        <ManualMatchDialog
          transaction={selected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </section>
  );
}
