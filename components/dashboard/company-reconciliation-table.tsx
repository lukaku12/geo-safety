"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { OutcomeBadge } from "@/components/dashboard/status-badges";
import { useCompanyReconciliation } from "@/hooks/use-dashboard-queries";
import type {
  CompanyReconciliation,
  ReconciliationOutcome,
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
  period,
  outcomeFilter = "all",
}: {
  period: PeriodKey;
  outcomeFilter?: ReconciliationOutcome | "all";
}) {
  const enabled = isMonthPeriod(period);
  const { data: raw, isPending, isError, refetch } =
    useCompanyReconciliation(period);

  const data = useMemo(
    () =>
      raw && outcomeFilter !== "all"
        ? raw.filter((r) => r.outcome === outcomeFilter)
        : raw,
    [raw, outcomeFilter],
  );

  const totals = useMemo(() => {
    if (!data) return null;
    return data.reduce(
      (acc, r) => ({
        expected: acc.expected + r.expected,
        actual: acc.actual + r.actual,
      }),
      { expected: 0, actual: 0 },
    );
  }, [data]);

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
        {enabled && data && data.length > 0 ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportCsv(data, period)}
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
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Tax ID</th>
                  <th className="px-4 py-3 text-right font-medium">Expected</th>
                  <th className="px-4 py-3 text-right font-medium">Actual</th>
                  <th className="px-4 py-3 text-right font-medium">Difference</th>
                  <th className="px-4 py-3 font-medium">Status</th>
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
                  : (data ?? []).map((row) => (
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
    </section>
  );
}
