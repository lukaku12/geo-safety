"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { PaginationBar, SortHeader } from "@/components/dashboard/table-controls";
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
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
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
        <Card className="overflow-hidden">
          <div
            className={cn(
              "overflow-x-auto",
              isPlaceholderData && "opacity-60 transition-opacity",
            )}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
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
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-4 py-3" colSpan={6}>
                          <Skeleton className="h-5 w-full" />
                        </td>
                      </tr>
                    ))
                  : rows.map((row) => (
                      <tr
                        key={row.companyId}
                        className="border-b border-border last:border-0 hover:bg-surface-muted/60"
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
                  <tr className="border-t border-border bg-surface-muted/40 font-semibold">
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
      ) : null}
    </section>
  );
}
