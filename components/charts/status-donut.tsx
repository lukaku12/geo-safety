"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { ReconciliationStats } from "@/lib/types/domain";
import { formatPercent } from "@/lib/utils/format";

// Tooltip surface mirrors the card tokens; raised shadow lifts it off the plot.
const TOOLTIP_STYLE = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  boxShadow: "var(--elevation-raised)",
  color: "var(--foreground)",
  fontSize: 13,
  padding: "8px 12px",
} as const;

/**
 * Matched / unmatched / ignored split as a donut, match rate centered.
 * These are status colors (the slices *mean* good/bad), so they reuse the
 * app's status tokens. Red vs. green alone is not colorblind-safe in dark
 * mode, so the legend below carries each slice's label and count.
 */
export function StatusDonut({ stats }: { stats: ReconciliationStats }) {
  const data = [
    { name: "Matched", value: stats.matchedCount, color: "var(--success)" },
    { name: "Unmatched", value: stats.unmatchedCount, color: "var(--danger)" },
    { name: "Ignored", value: stats.ignoredCount, color: "var(--muted-foreground)" },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        No transactions in this period.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={64}
              outerRadius={86}
              paddingAngle={2}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={false} />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tracking-tight">
            {formatPercent(stats.matchRate)}
          </span>
          <span className="text-xs text-muted-foreground">match rate</span>
        </div>
      </div>

      <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
        {data.map((entry) => (
          <li key={entry.name} className="flex items-center gap-1.5 text-xs">
            <span
              aria-hidden
              className="h-2 w-2 rounded-full"
              style={{ background: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="font-semibold tabular-nums text-foreground">
              {entry.value.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
