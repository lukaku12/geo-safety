import type { TransactionQuery } from "@/lib/validation/transactions";
import type { PeriodKey } from "@/lib/utils/periods";

/**
 * Centralised query-key factory. Every cache entry is namespaced under
 * `reconciliation` so a single `invalidateQueries({ queryKey: keys.all })` after
 * a mutation refreshes the whole dashboard atomically. Keys are structurally
 * stable (TanStack hashes them), so passing the filter object directly is safe.
 */
export const keys = {
  all: ["reconciliation"] as const,

  stats: (period: PeriodKey) => [...keys.all, "stats", period] as const,

  companies: () => [...keys.all, "companies"] as const,

  companyReconciliation: (period: PeriodKey) =>
    [...keys.all, "company-reconciliation", period] as const,

  transactions: () => [...keys.all, "transactions"] as const,
  transactionList: (filters: TransactionQuery) =>
    [...keys.transactions(), filters] as const,
} as const;
