"use client";

import { DashboardToolbar } from "@/components/dashboard/dashboard-toolbar";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { CompanyReconciliationTable } from "@/components/dashboard/company-reconciliation-table";
import { TransactionsPanel } from "@/components/dashboard/transactions-panel";
import { useDashboardParams } from "@/hooks/use-dashboard-params";

/**
 * Client root of the dashboard. All filter state is read from the URL via
 * `useDashboardParams` and the single `period` drives stats, the per-company
 * breakdown, and the transactions list. `useSearchParams` suspends on the
 * initial server render, so the page wraps this component in <Suspense>.
 */
export function Dashboard() {
  const { query, patch, toggleSort } = useDashboardParams();

  return (
    <div className="flex flex-col gap-8">
      <DashboardToolbar
        period={query.period}
        onPeriodChange={(period) => patch({ period, page: undefined })}
      />
      <StatsCards period={query.period} />
      <CompanyReconciliationTable period={query.period} />
      <TransactionsPanel query={query} patch={patch} toggleSort={toggleSort} />
    </div>
  );
}
