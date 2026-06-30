"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { OutcomeBadge } from "@/components/dashboard/status-badges";
import { StatusDonut } from "@/components/charts/status-donut";
import { ExpectedActualBars } from "@/components/charts/expected-actual-bars";
import {
  useCompanyReconciliation,
  useStats,
} from "@/hooks/use-dashboard-queries";
import { usePeriod } from "@/hooks/use-period";
import { isMonthPeriod } from "@/lib/utils/periods";
import { formatMonth, formatSignedCurrency } from "@/lib/utils/format";
import type { CompanyReconciliation } from "@/lib/types/domain";

function retryAction(refetch: () => void) {
  return (
    <button
      type="button"
      onClick={refetch}
      className="text-sm font-medium text-danger underline"
    >
      Retry
    </button>
  );
}

/** Companies that are over/underpaid, worst first — the operator's worklist. */
function needsAttention(rows: CompanyReconciliation[]): CompanyReconciliation[] {
  return rows
    .filter((r) => r.outcome === "underpaid" || r.outcome === "overpaid")
    .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
    .slice(0, 5);
}

export function Overview() {
  const { period } = usePeriod();
  const stats = useStats(period);
  const reconciliation = useCompanyReconciliation(period);
  const monthly = isMonthPeriod(period);

  const attention = useMemo(
    () => (reconciliation.data ? needsAttention(reconciliation.data) : []),
    [reconciliation.data],
  );

  return (
    <div className="flex flex-col gap-6">
      <StatsCards period={period} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Match breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.isError ? (
              <ErrorState
                className="border-0 py-10"
                description="Couldn't load the breakdown."
                action={retryAction(stats.refetch)}
              />
            ) : stats.isPending ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <StatusDonut stats={stats.data} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>
              Expected vs. actual
              {monthly ? ` — ${formatMonth(period)}` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!monthly ? (
              <EmptyState
                className="border-0 py-10"
                title="Pick a month"
                description="Expected amounts are monthly — choose a specific month to compare."
              />
            ) : reconciliation.isError ? (
              <ErrorState
                className="border-0 py-10"
                description="Couldn't load the comparison."
                action={retryAction(reconciliation.refetch)}
              />
            ) : reconciliation.isPending ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ExpectedActualBars rows={reconciliation.data} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Needs attention
          </CardTitle>
          <Link
            href="/reconciliation"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {!monthly ? (
            <p className="text-sm text-muted-foreground">
              Select a month to surface over/underpaid companies.
            </p>
          ) : reconciliation.isPending ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : attention.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Everything reconciles for this month. 🎉
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {attention.map((row) => (
                <li
                  key={row.companyId}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{row.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {row.taxId}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        row.difference < 0
                          ? "text-sm font-medium tabular-nums text-danger"
                          : "text-sm font-medium tabular-nums text-warning"
                      }
                    >
                      {formatSignedCurrency(row.difference)}
                    </span>
                    <OutcomeBadge outcome={row.outcome} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
