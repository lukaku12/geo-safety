"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { CompanyReconciliationTable } from "@/components/dashboard/company-reconciliation-table";
import { useReconciliationTableParams } from "@/hooks/use-table-params";
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
  const { query, patch, toggleSort } = useReconciliationTableParams();
  const [term, setTerm] = useState(query.q ?? "");
  const activeOutcome: OutcomeFilter = query.outcome ?? "all";

  const [lastExternalQ, setLastExternalQ] = useState(query.q);
  if (query.q !== lastExternalQ) {
    setLastExternalQ(query.q);
    setTerm(query.q ?? "");
  }

  useEffect(() => {
    const id = setTimeout(() => {
      if ((query.q ?? "") !== term) patch({ q: term || undefined });
    }, 300);
    return () => clearTimeout(id);
  }, [term, query.q, patch]);

  const controls = isMonthPeriod(query.period) ? (
    <div className="flex shrink-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
            aria-selected={activeOutcome === f.value}
            onClick={() =>
              patch({
                outcome: f.value === "all" ? undefined : f.value,
              })
            }
            className={cn(
              "rounded px-3 py-1.5 text-sm font-medium transition-colors",
              activeOutcome === f.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="relative sm:w-80">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search company or tax ID…"
          aria-label="Search reconciliation rows"
          className="h-10 w-full rounded-md border border-input bg-surface pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </div>
  ) : undefined;

  return (
    // h-full + min-h-0 down the chain: the page fits the viewport exactly and
    // only the table region scrolls (both axes) — never the document.
    // Heading → controls → table order comes from the table component, which
    // owns the header (its description and export action need the row data).
    <div className="flex h-full min-h-0 flex-col">
      <CompanyReconciliationTable
        query={query}
        patch={patch}
        toggleSort={toggleSort}
        controls={controls}
      />
    </div>
  );
}
