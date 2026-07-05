"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";

import { PeriodLink } from "@/components/layout/period-link";
import { PaginationBar, SortHeader } from "@/components/dashboard/table-controls";
import {
  PaginationBarSkeleton,
  TableSkeleton,
} from "@/components/dashboard/page-skeleton";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { OutcomeBadge } from "@/components/dashboard/status-badges";
import {
  useCompanies,
  useCompanyReconciliation,
} from "@/hooks/use-dashboard-queries";
import { usePeriod } from "@/hooks/use-period";
import { useCompanyTableParams } from "@/hooks/use-table-params";
import { isMonthPeriod } from "@/lib/utils/periods";
import type { CompanyReconciliation } from "@/lib/types/domain";
import type { CompanyQuery } from "@/lib/validation/companies";

export function CompaniesDirectory() {
  const { period } = usePeriod();
  const { query, patch, toggleSort } = useCompanyTableParams();
  const companies = useCompanies(query);
  const reconciliation = useCompanyReconciliation({
    period,
    q: query.q,
    sort: query.sort,
    order: query.order,
    page: query.page,
    pageSize: query.pageSize,
  });
  const [term, setTerm] = useState(query.q ?? "");
  const monthly = isMonthPeriod(period);

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

  // companyId → reconciliation row, for O(1) status lookups while rendering.
  const byId = useMemo(() => {
    const map = new Map<string, CompanyReconciliation>();
    reconciliation.data?.items.forEach((r) => map.set(r.companyId, r));
    return map;
  }, [reconciliation.data]);

  return (
    // h-full + min-h-0 down the chain: the page fits the viewport exactly and
    // only the table region scrolls (both axes) — never the document.
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* Search sits on the right, where the other table pages put it. */}
      <div className="flex shrink-0 sm:justify-end">
        <div className="relative w-full sm:w-80">
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
        <Card className="flex min-h-40 flex-1 flex-col overflow-hidden">
          <TableSkeleton />
        </Card>
      ) : companies.data.items.length === 0 ? (
        <EmptyState
          title="No companies match"
          description="Try a different name or tax ID."
        />
      ) : (
        <Card className="flex min-h-40 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full text-sm [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-card [&_th]:shadow-[inset_0_-1px_0_var(--border)]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <SortHeader<CompanyQuery["sort"]>
                    label="Company"
                    field="name"
                    active={query.sort === "name"}
                    order={query.order}
                    onToggle={toggleSort}
                  />
                  <SortHeader<CompanyQuery["sort"]>
                    label="Tax ID"
                    field="tax_id"
                    active={query.sort === "tax_id"}
                    order={query.order}
                    onToggle={toggleSort}
                  />
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    Active contracts
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {monthly ? "This month" : "Status"}
                  </th>
                  <th scope="col" className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {companies.data.items.map((company) => {
                  const recon = byId.get(company.id);
                  return (
                    <tr
                      key={company.id}
                      className="border-b border-border transition-colors duration-150 last:border-0 hover:bg-surface-muted/60"
                    >
                      <td className="px-4 py-3 font-medium">
                        <PeriodLink
                          href={`/companies/${company.id}`}
                          className="hover:text-primary hover:underline"
                        >
                          {company.name}
                        </PeriodLink>
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
                        <PeriodLink
                          href={`/companies/${company.id}`}
                          aria-label={`View ${company.name}`}
                          className="inline-flex text-muted-foreground hover:text-foreground"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </PeriodLink>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {companies.data && companies.data.items.length > 0 ? (
        <PaginationBar
          page={companies.data.page}
          pageSize={companies.data.pageSize}
          total={companies.data.total}
          totalPages={companies.data.totalPages}
          itemLabel="company"
          onPageChange={(page) => patch({ page })}
          onPageSizeChange={(pageSize) => patch({ pageSize })}
        />
      ) : companies.isPending ? (
        // Reserve the pagination row so the table card doesn't jump when data
        // lands.
        <PaginationBarSkeleton />
      ) : null}
    </div>
  );
}
