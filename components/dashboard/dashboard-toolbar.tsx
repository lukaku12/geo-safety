"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useRunReconciliation } from "@/hooks/use-dashboard-mutations";
import { getPeriodOptions, type PeriodKey } from "@/lib/utils/periods";
import { cn } from "@/lib/utils/cn";

export function DashboardToolbar({
  period,
  onPeriodChange,
}: {
  period: PeriodKey;
  onPeriodChange: (period: PeriodKey) => void;
}) {
  const run = useRunReconciliation();
  const options = getPeriodOptions();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <label htmlFor="period" className="text-sm text-muted-foreground">
          Period
        </label>
        <Select
          id="period"
          value={period}
          onChange={(e) => onPeriodChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-3">
        {run.isSuccess && run.data ? (
          <span className="text-sm text-muted-foreground" role="status">
            Matched {run.data.matchedCount} • {run.data.unmatchedCount} still
            unmatched
          </span>
        ) : null}
        {run.isError ? (
          <span className="text-sm text-danger" role="status">
            Auto-match failed
          </span>
        ) : null}
        <Button onClick={() => run.mutate()} disabled={run.isPending}>
          <RefreshCw
            className={cn("h-4 w-4", run.isPending && "animate-spin")}
          />
          {run.isPending ? "Matching…" : "Run auto-match"}
        </Button>
      </div>
    </div>
  );
}
