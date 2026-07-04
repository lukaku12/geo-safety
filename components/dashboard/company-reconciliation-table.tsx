"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { PaginationBar, SortHeader } from "@/components/dashboard/table-controls";
import { PaginationBarSkeleton } from "@/components/dashboard/page-skeleton";
import { OutcomeBadge } from "@/components/dashboard/status-badges";
import { useCompanyReconciliation } from "@/hooks/use-dashboard-queries";
import type { useReconciliationTableParams } from "@/hooks/use-table-params";
import type {
  CompanyReconciliation,
} from "@/lib/types/domain";
import { isMonthPeriod, type PeriodKey } from "@/lib/utils/periods";
import { formatCurrency, formatMonth, formatSignedCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { downloadCsv, toCsv } from "@/lib/utils/csv";
import { OUTCOME_LABELS } from "@/lib/reconciliation/status";

function differenceClass(difference: number): string {
  if (Math.abs(difference) <= 0.005) return "text-muted-foreground";
  return difference < 0 ? "text-danger" : "text-warning";
}

/**
 * Rows needing operator action get a soft tint plus a left accent bar, not
 * just their badge — the soft tokens alone are too faint in light mode. The
 * accent is an inset shadow on the first cell because row borders don't
 * survive collapsed sticky tables.
 */
function rowClass(row: CompanyReconciliation): string {
  if (row.outcome === "underpaid") {
    return "bg-danger-soft/60 hover:bg-danger-soft [&>td:first-child]:shadow-[inset_3px_0_0_var(--danger)]";
  }
  if (row.outcome === "unpaid") {
    return "bg-warning-soft/60 hover:bg-warning-soft [&>td:first-child]:shadow-[inset_3px_0_0_var(--warning)]";
  }
  return "hover:bg-surface-muted/60";
}

function exportCsv(rows: CompanyReconciliation[], period: PeriodKey) {
  const csv = toCsv(
    ["Company", "Tax ID", "Expected", "Actual", "Difference", "Status"],
    rows.map((r) => [
      r.name,
      r.taxId,
      r.expected.toFixed(2),
      r.actual.toFixed(2),
      r.difference.toFixed(2),
      OUTCOME_LABELS[r.outcome],
    ]),
  );
  downloadCsv(`reconciliation-${period}.csv`, csv);
}

export function CompanyReconciliationTable({
  query,
  patch,
  toggleSort,
}: {
  query: ReturnType<typeof useReconciliationTableParams>["query"];
  patch: ReturnType<typeof useReconciliationTableParams>["patch"];
  toggleSort: ReturnType<typeof useReconciliationTableParams>["toggleSort"];
}) {
  const period = query.period as PeriodKey;
  const enabled = isMonthPeriod(period);
  const { data, isPending, isPlaceholderData, isError, refetch } =
    useCompanyReconciliation(query);
  const rows = useMemo(() => data?.items ?? [], [data]);

  const totals = useMemo(() => {
    if (!data) return null;
    return rows.reduce(
      (acc, r) => ({
        expected: acc.expected + r.expected,
        actual: acc.actual + r.actual,
      }),
      { expected: 0, actual: 0 },
    );
  }, [data, rows]);

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Expected vs. actual</h2>
          <p className="text-sm text-muted-foreground">
            {enabled
              ? `Per-company billing reconciliation for ${formatMonth(period)}.`
              : "Pick a specific month to compare contracted amounts with payments."}
          </p>
        </div>
        {enabled && rows.length > 0 ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportCsv(rows, period)}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        ) : null}
      </div>

      {!enabled ? (
        <EmptyState
          title="No month selected"
          description="Expected amounts are monthly, so choose April, May, or June 2026 to see the breakdown."
        />
      ) : isError ? (
        <ErrorState
          description="Couldn't load the reconciliation breakdown."
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
      ) : !isPending && data && rows.length === 0 ? (
        <EmptyState
          title="No reconciliation rows match"
          description="Try clearing the search or changing the outcome filter."
        />
      ) : (
        <Card className="flex min-h-40 flex-1 flex-col overflow-hidden">
          <div
            className={cn(
              "min-h-0 flex-1 overflow-auto",
              isPlaceholderData && "opacity-60 transition-opacity",
            )}
          >
            {/* Header cells stick to the top and the totals row to the bottom
                of the scroll region; rules are inset shadows because collapsed
                table borders don't travel with sticky cells. */}
            <table className="w-full text-sm [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-card [&_th]:shadow-[inset_0_-1px_0_var(--border)] [&_tfoot_td]:sticky [&_tfoot_td]:bottom-0 [&_tfoot_td]:bg-card [&_tfoot_td]:shadow-[inset_0_1px_0_var(--border)]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <SortHeader
                    label="Company"
                    field="name"
                    active={query.sort === "name"}
                    order={query.order}
                    onToggle={toggleSort}
                  />
                  <SortHeader
                    label="Tax ID"
                    field="tax_id"
                    active={query.sort === "tax_id"}
                    order={query.order}
                    onToggle={toggleSort}
                  />
                  <SortHeader
                    label="Expected"
                    field="expected"
                    active={query.sort === "expected"}
                    order={query.order}
                    onToggle={toggleSort}
                    align="right"
                  />
                  <SortHeader
                    label="Actual"
                    field="actual"
                    active={query.sort === "actual"}
                    order={query.order}
                    onToggle={toggleSort}
                    align="right"
                  />
                  <SortHeader
                    label="Difference"
                    field="difference"
                    active={query.sort === "difference"}
                    order={query.order}
                    onToggle={toggleSort}
                    align="right"
                  />
                  <SortHeader
                    label="Status"
                    field="outcome"
                    active={query.sort === "outcome"}
                    order={query.order}
                    onToggle={toggleSort}
                  />
                </tr>
              </thead>
              <tbody>
                {isPending
                  ? // Placeholder cells share the real columns' alignment so
                    // the header, numbers, and badges land exactly in place.
                    Array.from({ length: 12 }).map((_, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-4 py-3.5">
                          <Skeleton
                            className={cn("h-4", i % 2 === 0 ? "w-40" : "w-48")}
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <Skeleton className="h-4 w-24" />
                        </td>
                        <td className="px-4 py-3.5">
                          <Skeleton className="ml-auto h-4 w-20" />
                        </td>
                        <td className="px-4 py-3.5">
                          <Skeleton className="ml-auto h-4 w-20" />
                        </td>
                        <td className="px-4 py-3.5">
                          <Skeleton className="ml-auto h-4 w-20" />
                        </td>
                        <td className="px-4 py-3.5">
                          <Skeleton className="h-5 w-24 rounded-full" />
                        </td>
                      </tr>
                    ))
                  : rows.map((row) => (
                      <tr
                        key={row.companyId}
                        className={cn(
                          "border-b border-border transition-colors duration-150 last:border-0",
                          rowClass(row),
                        )}
                      >
                        <td className="px-4 py-3 font-medium">{row.name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {row.taxId}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatCurrency(row.expected)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatCurrency(row.actual)}
                        </td>
                        <td
                          className={cn(
                            "px-4 py-3 text-right font-medium tabular-nums",
                            differenceClass(row.difference),
                          )}
                        >
                          {formatSignedCurrency(row.difference)}
                        </td>
                        <td className="px-4 py-3">
                          <OutcomeBadge outcome={row.outcome} />
                        </td>
                      </tr>
                    ))}
              </tbody>
              {totals ? (
                <tfoot>
                  <tr className="font-semibold">
                    <td className="px-4 py-3" colSpan={2}>
                      Total
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatCurrency(totals.expected)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatCurrency(totals.actual)}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right tabular-nums",
                        differenceClass(totals.actual - totals.expected),
                      )}
                    >
                      {formatSignedCurrency(totals.actual - totals.expected)}
                    </td>
                    <td className="px-4 py-3" />
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        </Card>
      )}

      {data && rows.length > 0 ? (
        <PaginationBar
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          totalPages={data.totalPages}
          itemLabel="row"
          onPageChange={(page) => patch({ page })}
          onPageSizeChange={(pageSize) => patch({ pageSize })}
        />
      ) : enabled && isPending ? (
        // Reserve the pagination row so the table card doesn't jump when data
        // lands. (A disabled query — no month picked — also reports pending,
        // hence the `enabled` gate.)
        <PaginationBarSkeleton />
      ) : null}
    </section>
  );
}
