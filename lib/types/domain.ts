import type {
  ContractStatus,
  MatchMethod,
  TransactionStatus,
} from "@/lib/supabase/database.types";

export type { ContractStatus, MatchMethod, TransactionStatus };

/**
 * Domain models — the camelCase shapes the API returns and the UI consumes.
 * Service functions map raw snake_case DB rows into these, so the database
 * naming convention never leaks past the service boundary. Type-only + plain
 * data, so this module is safe to import from both server and client code.
 */

export interface Company {
  id: string;
  name: string;
  taxId: string;
}

export interface Transaction {
  id: string;
  docKey: string;
  entryDate: string; // ISO date (YYYY-MM-DD)
  amount: number;
  currency: string;
  senderName: string | null;
  senderInn: string | null;
  senderAccount: string | null;
  purpose: string | null;
  status: TransactionStatus;
  matchMethod: MatchMethod | null;
  matchConfidence: number | null;
  matchedCompany: Pick<Company, "id" | "name" | "taxId"> | null;
  updatedAt: string;
}

export interface ReconciliationStats {
  totalCount: number;
  matchedCount: number;
  unmatchedCount: number;
  ignoredCount: number;
  totalAmount: number;
  matchedAmount: number;
  unmatchedAmount: number;
  /** matched ÷ (matched + unmatched); `ignored` is excluded from the denominator. */
  matchRate: number;
}

/** Outcome of comparing what a company owes vs. what actually arrived. */
export type ReconciliationOutcome =
  | "ok" // paid == expected (within rounding tolerance)
  | "underpaid" // paid < expected
  | "overpaid" // paid > expected
  | "inactive"; // no active contract and nothing received

export interface CompanyReconciliation {
  companyId: string;
  name: string;
  taxId: string;
  expected: number;
  actual: number;
  difference: number; // actual - expected
  matchedCount: number;
  activeContractCount: number;
  outcome: ReconciliationOutcome;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface RunReconciliationResult {
  matchedCount: number;
  unmatchedCount: number;
  totalProcessed: number;
}
