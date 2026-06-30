"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { OutcomeBadge } from "@/components/dashboard/status-badges";
import {
  useCompanies,
  useCompanyReconciliation,
} from "@/hooks/use-dashboard-queries";
import { usePeriod } from "@/hooks/use-period";
import { isMonthPeriod } from "@/lib/utils/periods";
import type { CompanyReconciliation } from "@/lib/types/domain";

export function CompaniesDirectory() {
  const { period } = usePeriod();
  const companies = useCompanies();
  const reconciliation = useCompanyReconciliation(period);
  const [term, setTerm] = useState("");
  const monthly = isMonthPeriod(period);

  // companyId → reconciliation row, for O(1) status lookups while rendering.
  const byId = useMemo(() => {
    const map = new Map<string, CompanyReconciliation>();
    reconciliation.data?.forEach((r) => map.set(r.companyId, r));
    return map;
  }, [reconciliation.data]);

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    const list = companies.data ?? [];
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.taxId.toLowerCase().includes(q),
    );
  }, [companies.data, term]);

  const periodSuffix = monthly ? `?period=${period}` : "";

  return (
    <div className="flex flex-col gap-4">
      <div className="relative sm:w-80">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search company or tax ID…"
          aria-label="Search companies"
          className="h-10 w-full rounded-md border border-input bg-surface pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {companies.isError ? (
        <ErrorState
          description="Couldn't load companies."
          action={
            <button
              type="button"
              onClick={() => companies.refetch()}
              className="text-sm font-medium text-danger underline"
            >
              Retry
            </button>
          }
        />
      ) : companies.isPending ? (
        <Card className="p-4">
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No companies match"
          description="Try a different name or tax ID."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Tax ID</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Active contracts
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {monthly ? "This month" : "Status"}
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((company) => {
                  const recon = byId.get(company.id);
                  return (
                    <tr
                      key={company.id}
                      className="border-b border-border last:border-0 hover:bg-surface-muted/60"
                    >
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/companies/${company.id}${periodSuffix}`}
                          className="hover:text-primary hover:underline"
                        >
                          {company.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {company.taxId}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {recon ? recon.activeContractCount : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {recon ? (
                          <OutcomeBadge outcome={recon.outcome} />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {monthly ? "—" : "Pick a month"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/companies/${company.id}${periodSuffix}`}
                          aria-label={`View ${company.name}`}
                          className="inline-flex text-muted-foreground hover:text-foreground"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
