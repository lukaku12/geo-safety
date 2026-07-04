"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { CompanyReconciliation } from "@/lib/types/domain";

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

/** Truncate long company names so axis labels stay legible. */
function shortName(name: string): string {
  return name.length > 16 ? `${name.slice(0, 15)}…` : name;
}

/**
 * Top companies by expected amount: contracted (expected) vs. received
 * (actual). Expected is the reference series, so it wears the de-emphasis
 * gray; Actual carries the primary hue. Green/red stay reserved for status
 * (badges, donut) — "actual" isn't inherently good.
 */
export function ExpectedActualBars({
  rows,
  limit = 6,
}: {
  rows: CompanyReconciliation[];
  limit?: number;
}) {
  const data = useMemo(
    () =>
      [...rows]
        .sort((a, b) => b.expected - a.expected)
        .slice(0, limit)
        .map((r) => ({
          name: shortName(r.name),
          Expected: Number(r.expected.toFixed(2)),
          Actual: Number(r.actual.toFixed(2)),
        })),
    [rows, limit],
  );

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No contracted companies in this period.
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          barSize={20}
          barGap={4}
          margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
        >
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickFormatter={(v: number) => v.toLocaleString()}
            tickLine={false}
            axisLine={false}
            width={52}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: "var(--surface-muted)", opacity: 0.6 }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="square"
            iconSize={10}
            height={28}
            wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
          />
          <Bar
            dataKey="Expected"
            fill="var(--muted-foreground)"
            radius={[4, 4, 0, 0]}
          />
          <Bar dataKey="Actual" fill="var(--primary)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
