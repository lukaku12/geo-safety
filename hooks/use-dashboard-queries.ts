"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";
import { isMonthPeriod, type PeriodKey } from "@/lib/utils/periods";
import type { CompanyQuery } from "@/lib/validation/companies";
import type { CompanyReconciliationQuery } from "@/lib/validation/reconciliation";
import type { TransactionQuery } from "@/lib/validation/transactions";

export function useStats(period: PeriodKey) {
  return useQuery({
    queryKey: keys.stats(period),
    queryFn: () => api.getStats(period),
    // Keep the previous month's numbers visible while the next month loads,
    // instead of flashing back to the loading skeleton on every switch.
    placeholderData: keepPreviousData,
  });
}

export function useCompanies(query: CompanyQuery) {
  return useQuery({
    queryKey: keys.companyList(query),
    queryFn: () => api.getCompanies(query),
    placeholderData: keepPreviousData,
    staleTime: 10 * 60_000, // company list rarely changes
  });
}

export function useCompanyOptions() {
  return useQuery({
    queryKey: keys.companyOptions(),
    queryFn: () => api.getCompanyOptions(),
    staleTime: 10 * 60_000, // company list rarely changes
  });
}

export function useCompanyDetail(id: string) {
  return useQuery({
    queryKey: keys.companyDetail(id),
    queryFn: () => api.getCompanyDetail(id),
    enabled: Boolean(id),
  });
}

export function useCompanyReconciliation(
  query: CompanyReconciliationQuery,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: keys.companyReconciliation(query),
    queryFn: () => api.getCompanyReconciliationPage(query),
    // Expected-vs-actual only makes sense for a concrete month.
    enabled: isMonthPeriod(query.period as PeriodKey) && options.enabled !== false,
    // Keep the previous month's rows visible while the next month loads, so
    // switching months doesn't flash the skeleton (or the "Needs attention"
    // card popping in and out) before the real numbers are in.
    placeholderData: keepPreviousData,
  });
}

export function useTransactions(query: TransactionQuery) {
  return useQuery({
    queryKey: keys.transactionList(query),
    queryFn: () => api.getTransactions(query),
    // Keep the previous page visible while the next one loads (no flash to blank).
    placeholderData: keepPreviousData,
  });
}
