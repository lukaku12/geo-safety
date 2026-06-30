"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { useStats } from "@/hooks/use-dashboard-queries";
import type { ReconciliationStats } from "@/lib/types/domain";
import type { PeriodKey } from "@/lib/utils/periods";
import {
  formatCurrency,
  formatPercent,
} from "@/lib/utils/format";

function StatCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function buildCards(stats: ReconciliationStats) {
  return [
    {
      title: "Total transactions",
      value: stats.totalCount.toLocaleString(),
      hint: `${formatCurrency(stats.totalAmount)} received`,
    },
    {
      title: "Matched",
      value: stats.matchedCount.toLocaleString(),
      hint: `${formatCurrency(stats.matchedAmount)} • ${formatPercent(stats.matchRate)} match rate`,
    },
    {
      title: "Unmatched",
      value: stats.unmatchedCount.toLocaleString(),
      hint: `${formatCurrency(stats.unmatchedAmount)} awaiting review`,
    },
    {
      title: "Ignored",
      value: stats.ignoredCount.toLocaleString(),
      hint: "Excluded from match rate",
    },
  ];
}

export function StatsCards({ period }: { period: PeriodKey }) {
  const { data, isPending, isError, refetch } = useStats(period);

  if (isError) {
    return (
      <ErrorState
        title="Couldn't load summary"
        description="The stats service is unavailable. Check your Supabase connection."
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
    );
  }

  if (isPending) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16" />
              <Skeleton className="mt-2 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {buildCards(data).map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
}
