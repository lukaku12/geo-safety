"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";
import { isMonthPeriod, type PeriodKey } from "@/lib/utils/periods";
import type { TransactionQuery } from "@/lib/validation/transactions";

export function useStats(period: PeriodKey) {
  return useQuery({
    queryKey: keys.stats(period),
    queryFn: () => api.getStats(period),
  });
}

export function useCompanies() {
  return useQuery({
    queryKey: keys.companies(),
    queryFn: () => api.getCompanies(),
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

export function useCompanyReconciliation(period: PeriodKey) {
  return useQuery({
    queryKey: keys.companyReconciliation(period),
    queryFn: () => api.getCompanyReconciliation(period),
    // Expected-vs-actual only makes sense for a concrete month.
    enabled: isMonthPeriod(period),
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
