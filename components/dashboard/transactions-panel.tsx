"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { TransactionFilters } from "@/components/dashboard/transaction-filters";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { ManualMatchDialog } from "@/components/dashboard/manual-match-dialog";
import { useTransactions } from "@/hooks/use-dashboard-queries";
import type { UseDashboardParams } from "@/hooks/use-dashboard-params";
import type { Transaction } from "@/lib/types/domain";

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
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Transactions</h2>
        <p className="text-sm text-muted-foreground">
          Review incoming transfers and reconcile them with companies.
        </p>
      </div>

      <TransactionFilters query={query} patch={patch} />

      <Card className="overflow-hidden">
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
          <div className="space-y-3 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data.items.length === 0 ? (
          <EmptyState
            className="border-0"
            title="No transactions match"
            description="Try clearing the search or switching status filters."
          />
        ) : (
          <div
            className={
              isPlaceholderData ? "opacity-60 transition-opacity" : undefined
            }
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
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages} • {data.total} transaction
            {data.total === 1 ? "" : "s"}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => patch({ page: data.page - 1 })}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={data.page >= data.totalPages}
              onClick={() => patch({ page: data.page + 1 })}
            >
              Next
            </Button>
          </div>
        </div>
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
