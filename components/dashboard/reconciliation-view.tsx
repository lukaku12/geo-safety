"use client";

import { useState } from "react";

import { CompanyReconciliationTable } from "@/components/dashboard/company-reconciliation-table";
import { usePeriod } from "@/hooks/use-period";
import { isMonthPeriod } from "@/lib/utils/periods";
import { cn } from "@/lib/utils/cn";
import type { ReconciliationOutcome } from "@/lib/types/domain";

type OutcomeFilter = ReconciliationOutcome | "all";

const FILTERS: { value: OutcomeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "underpaid", label: "Underpaid" },
  { value: "overpaid", label: "Overpaid" },
  { value: "ok", label: "On track" },
  { value: "unpaid", label: "No payments" },
  { value: "inactive", label: "No contract" },
];

/** Client entry for the Reconciliation page — outcome filter over the table. */
export function ReconciliationView() {
  const { period } = usePeriod();
  const [outcome, setOutcome] = useState<OutcomeFilter>("all");

  return (
    <div className="flex flex-col gap-4">
      {isMonthPeriod(period) ? (
        <div
          role="tablist"
          aria-label="Filter by outcome"
          className="inline-flex flex-wrap gap-0.5 self-start rounded-md border border-border bg-surface p-0.5"
        >
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={outcome === f.value}
              onClick={() => setOutcome(f.value)}
              className={cn(
                "rounded px-3 py-1.5 text-sm font-medium transition-colors",
                outcome === f.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      ) : null}

      <CompanyReconciliationTable period={period} outcomeFilter={outcome} />
    </div>
  );
}
