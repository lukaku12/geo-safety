"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, ArrowRight } from "lucide-react";

import { PeriodLink } from "@/components/layout/period-link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { cn } from "@/lib/utils/cn";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { OutcomeBadge } from "@/components/dashboard/status-badges";
import {
  useCompanyReconciliation,
  useStats,
} from "@/hooks/use-dashboard-queries";
import { usePeriod } from "@/hooks/use-period";
import { isMonthPeriod } from "@/lib/utils/periods";
import { formatMonth, formatSignedCurrency } from "@/lib/utils/format";
import type { CompanyReconciliation } from "@/lib/types/domain";

// Charts are split out of the route's first-load bundle — recharts is by far
// the heaviest client dependency, and the charts only render once query data
// arrives anyway. The loading fallbacks mirror the data-pending skeletons.
const StatusDonut = dynamic(
  () => import("@/components/charts/status-donut").then((m) => m.StatusDonut),
  { ssr: false, loading: () => <Skeleton className="h-56 w-full" /> },
);
const ExpectedActualBars = dynamic(
  () =>
    import("@/components/charts/expected-actual-bars").then(
      (m) => m.ExpectedActualBars,
    ),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> },
);

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

/** Companies whose billing didn't reconcile, worst first — the operator's worklist. */
function needsAttention(rows: CompanyReconciliation[]): CompanyReconciliation[] {
  return rows
    .filter(
      (r) =>
        r.outcome === "underpaid" ||
        r.outcome === "overpaid" ||
        r.outcome === "unpaid",
    )
    .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
    .slice(0, 5);
}

function reconciliationItemHref(row: CompanyReconciliation): string {
  const params = new URLSearchParams({
    q: row.taxId,
    outcome: row.outcome,
  });
  return `/reconciliation?${params.toString()}`;
}

export function Overview() {
  const { period } = usePeriod();
  const stats = useStats(period);
  const reconciliation = useCompanyReconciliation({
    period,
    q: undefined,
    page: 1,
    pageSize: 100,
    sort: "name",
    order: "asc",
  });
  const monthly = isMonthPeriod(period);

  const attention = useMemo(
    () =>
      reconciliation.data ? needsAttention(reconciliation.data.items) : [],
    [reconciliation.data],
  );

  // This widget only ever has something useful to say once we know there are
  // items to flag — no skeleton while loading, no "all clear" filler text, no
  // duplicate error UI (the "Expected vs. actual" card above already surfaces
  // reconciliation errors with retry). It simply appears when it has data.
  const showAttentionCard =
    monthly && reconciliation.isSuccess && attention.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <StatsCards period={period} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Match breakdown</CardTitle>
          </CardHeader>
          <CardContent
            className={cn(
              stats.isPlaceholderData && "opacity-60 transition-opacity",
            )}
          >
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
          <CardContent
            className={cn(
              reconciliation.isPlaceholderData &&
                "opacity-60 transition-opacity",
            )}
          >
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
              <ExpectedActualBars rows={reconciliation.data.items} />
            )}
          </CardContent>
        </Card>
      </div>

      {showAttentionCard ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Needs attention
            </CardTitle>
            <PeriodLink
              href="/reconciliation"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </PeriodLink>
          </CardHeader>
          <CardContent
            className={cn(
              reconciliation.isPlaceholderData &&
                "opacity-60 transition-opacity",
            )}
          >
            <ul className="divide-y divide-border">
              {attention.map((row) => (
                <li
                  key={row.companyId}
                  className="py-0.5"
                >
                  <PeriodLink
                    href={reconciliationItemHref(row)}
                    className="flex items-center justify-between gap-3 rounded-md py-2.5 transition-colors hover:bg-surface-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Open reconciliation row for ${row.name}`}
                  >
                    <div className="min-w-0 pl-2">
                      <p className="truncate text-sm font-medium">
                        {row.name}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {row.taxId}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 pr-2">
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
                  </PeriodLink>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
