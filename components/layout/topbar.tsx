"use client";

import { usePathname } from "next/navigation";
import { Menu, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { titleForPath } from "@/components/layout/nav-items";
import { usePeriod } from "@/hooks/use-period";
import { useRunReconciliation } from "@/hooks/use-dashboard-mutations";
import { getPeriodOptions } from "@/lib/utils/periods";
import { cn } from "@/lib/utils/cn";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const { period, setPeriod } = usePeriod();
  const run = useRunReconciliation();
  const options = getPeriodOptions();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="rounded-md p-2 text-muted-foreground hover:bg-surface-muted hover:text-foreground lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="text-base font-semibold sm:text-lg">
        {titleForPath(pathname)}
      </h1>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <Select
          aria-label="Billing period"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          {options.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </Select>

        <Button
          onClick={() => run.mutate()}
          disabled={run.isPending}
          className="whitespace-nowrap"
        >
          <RefreshCw className={cn("h-4 w-4", run.isPending && "animate-spin")} />
          <span className="hidden sm:inline">
            {run.isPending ? "Matching…" : "Run auto-match"}
          </span>
        </Button>
      </div>
    </header>
  );
}
