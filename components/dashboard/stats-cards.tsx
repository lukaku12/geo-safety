"use client";

import type { LucideIcon } from "lucide-react";
import { AlertTriangle, CheckCircle2, EyeOff, Receipt } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  type CardTone,
} from "@/components/ui/card";
import { ErrorState } from "@/components/ui/states";
import { StatsGridSkeleton } from "@/components/dashboard/page-skeleton";
import { useStats } from "@/hooks/use-dashboard-queries";
import { cn } from "@/lib/utils/cn";
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
  icon: Icon,
  iconClass,
  tone = "default",
}: {
  title: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  iconClass: string;
  tone?: CardTone;
}) {
  return (
    <Card tone={tone}>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
            iconClass,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        {hint ? (
          <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
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
      icon: Receipt,
      iconClass: "bg-primary/10 text-primary",
    },
    {
      title: "Matched",
      value: stats.matchedCount.toLocaleString(),
      hint: `${formatCurrency(stats.matchedAmount)} • ${formatPercent(stats.matchRate)} match rate`,
      icon: CheckCircle2,
      iconClass: "bg-success-soft text-success",
    },
    {
      title: "Unmatched",
      value: stats.unmatchedCount.toLocaleString(),
      hint: `${formatCurrency(stats.unmatchedAmount)} awaiting review`,
      icon: AlertTriangle,
      // Opacity tint (not the soft token) so the chip still reads on the
      // danger-toned card background.
      iconClass: "bg-danger/10 text-danger",
      // An unmatched backlog is the operator's problem card — let it outrank
      // the routine tiles instead of blending in.
      tone: (stats.unmatchedCount > 0 ? "danger" : "default") as CardTone,
    },
    {
      title: "Ignored",
      value: stats.ignoredCount.toLocaleString(),
      hint: "Excluded from match rate",
      icon: EyeOff,
      iconClass: "bg-muted text-muted-foreground",
    },
  ];
}

export function StatsCards({ period }: { period: PeriodKey }) {
  const { data, isPending, isPlaceholderData, isError, refetch } =
    useStats(period);

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
    return <StatsGridSkeleton />;
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4",
        isPlaceholderData && "opacity-60 transition-opacity",
      )}
    >
      {buildCards(data).map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
}
