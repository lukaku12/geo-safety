"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { ReconciliationStats } from "@/lib/types/domain";
import { formatPercent } from "@/lib/utils/format";

const TOOLTIP_STYLE = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--foreground)",
  fontSize: 13,
} as const;

/** Matched / unmatched / ignored split as a donut, with the match rate centered. */
export function StatusDonut({ stats }: { stats: ReconciliationStats }) {
  const data = [
    { name: "Matched", value: stats.matchedCount, color: "var(--success)" },
    { name: "Unmatched", value: stats.unmatchedCount, color: "var(--warning)" },
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
    <div className="relative h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={64}
            outerRadius={88}
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
        <span className="text-2xl font-semibold tabular-nums">
          {formatPercent(stats.matchRate)}
        </span>
        <span className="text-xs text-muted-foreground">match rate</span>
      </div>
    </div>
  );
}
