"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, RefreshCw, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { descriptionForPath, titleForPath } from "@/components/layout/nav-items";
import { usePeriod } from "@/hooks/use-period";
import {
  useResetReconciliation,
  useRunReconciliation,
} from "@/hooks/use-dashboard-mutations";
import { getPeriodOptions } from "@/lib/utils/periods";
import { cn } from "@/lib/utils/cn";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const { period, setPeriod } = usePeriod();
  const run = useRunReconciliation();
  const reset = useResetReconciliation();
  const options = getPeriodOptions();

  // Two-step confirm: the first click arms the button, a second within 4s fires.
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (!confirming) return;
    const id = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(id);
  }, [confirming]);

  const onReset = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    reset.mutate();
  };

  return (
    <header className="relative z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="rounded-md p-2 text-muted-foreground hover:bg-surface-muted hover:text-foreground lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold leading-tight sm:text-lg">
          {titleForPath(pathname)}
        </h1>
        {/* Hidden on small screens — the period select and actions win the
            space; the title alone still identifies the page. */}
        <p className="hidden truncate text-xs text-muted-foreground md:block">
          {descriptionForPath(pathname)}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {/* A view filter, not an action — stays open so the user can flip
            through months and compare; Escape/outside-click dismiss it. */}
        <Select
          aria-label="Billing period"
          value={period}
          onValueChange={setPeriod}
          closeOnSelect={false}
          options={options.map((o) => ({ value: o.key, label: o.label }))}
        />

        <Button
          variant={confirming ? "danger" : "secondary"}
          onClick={onReset}
          disabled={reset.isPending}
          aria-label="Reset database to seeded state"
          title="Reset all transactions to their original unmatched state"
          className="whitespace-nowrap"
        >
          <RotateCcw
            className={cn("h-4 w-4", reset.isPending && "animate-spin")}
          />
          <span className="hidden sm:inline">
            {reset.isPending
              ? "Resetting…"
              : confirming
                ? "Confirm reset"
                : "Reset"}
          </span>
        </Button>

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
