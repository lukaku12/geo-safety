import type { CompanyQuery } from "@/lib/validation/companies";
import type { CompanyReconciliationQuery } from "@/lib/validation/reconciliation";
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
  companyList: (filters: CompanyQuery) =>
    [...keys.companies(), "list", filters] as const,
  companyOptions: () => [...keys.companies(), "options"] as const,
  companyDetail: (id: string) => [...keys.companies(), "detail", id] as const,

  companyReconciliation: (filters: CompanyReconciliationQuery) =>
    [...keys.all, "company-reconciliation", filters] as const,

  transactions: () => [...keys.all, "transactions"] as const,
  transactionList: (filters: TransactionQuery) =>
    [...keys.transactions(), filters] as const,
} as const;
