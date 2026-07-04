"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import type { UseDashboardParams } from "@/hooks/use-dashboard-params";
import type { TransactionStatus } from "@/lib/types/domain";

const STATUS_TABS: { value: TransactionStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "matched", label: "Matched" },
  { value: "unmatched", label: "Unmatched" },
  { value: "ignored", label: "Ignored" },
];

export function TransactionFilters({
  query,
  patch,
}: {
  query: UseDashboardParams["query"];
  patch: UseDashboardParams["patch"];
}) {
  const [term, setTerm] = useState(query.q ?? "");

  // Reflect external (URL) changes, e.g. back-navigation, by adjusting state
  // during render — the React-recommended alternative to a sync effect.
  const [lastExternalQ, setLastExternalQ] = useState(query.q);
  if (query.q !== lastExternalQ) {
    setLastExternalQ(query.q);
    setTerm(query.q ?? "");
  }

  // Debounce typing into a single URL update.
  useEffect(() => {
    const id = setTimeout(() => {
      if ((query.q ?? "") !== term) patch({ q: term || undefined });
    }, 300);
    return () => clearTimeout(id);
  }, [term, query.q, patch]);

  const activeStatus = query.status ?? "all";

  return (
    <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div
        role="tablist"
        aria-label="Filter by status"
        className="inline-flex rounded-md border border-border bg-surface p-0.5"
      >
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={activeStatus === tab.value}
            onClick={() =>
              patch({
                status: tab.value === "all" ? undefined : tab.value,
              })
            }
            className={cn(
              "rounded px-3 py-1.5 text-sm font-medium transition-colors",
              activeStatus === tab.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative sm:w-72">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search name, INN, or purpose…"
          aria-label="Search transactions"
          className="h-10 w-full rounded-md border border-input bg-surface pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </div>
  );
}
