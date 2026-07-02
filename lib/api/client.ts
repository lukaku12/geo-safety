import type {
  Company,
  CompanyDetail,
  CompanyReconciliation,
  Paginated,
  ReconciliationStats,
  ResetReconciliationResult,
  RunReconciliationResult,
  Transaction,
} from "@/lib/types/domain";
import type { CompanyQuery } from "@/lib/validation/companies";
import type {
  TransactionQuery,
  UpdateTransactionInput,
} from "@/lib/validation/transactions";
import type { CompanyReconciliationQuery } from "@/lib/validation/reconciliation";
import type { PeriodKey } from "@/lib/utils/periods";

/** Error thrown by the client fetchers, carrying the server status + message. */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "content-type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // non-JSON error body — keep the status text
    }
    throw new ApiClientError(message, res.status);
  }

  return (await res.json()) as T;
}

function toSearchParams(query: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params.toString();
}

export const api = {
  getTransactions(query: TransactionQuery): Promise<Paginated<Transaction>> {
    return fetchJson(`/api/transactions?${toSearchParams(query)}`);
  },

  updateTransaction(
    id: string,
    input: UpdateTransactionInput,
  ): Promise<Transaction> {
    return fetchJson(`/api/transactions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  getStats(period: PeriodKey): Promise<ReconciliationStats> {
    return fetchJson(`/api/stats?period=${encodeURIComponent(period)}`);
  },

  getCompanyReconciliationPage(
    query: CompanyReconciliationQuery,
  ): Promise<Paginated<CompanyReconciliation>> {
    return fetchJson(`/api/reconciliation?${toSearchParams(query)}`);
  },

  getCompanies(query: CompanyQuery): Promise<Paginated<Company>> {
    return fetchJson(`/api/companies?${toSearchParams(query)}`);
  },

  getCompanyOptions(): Promise<Company[]> {
    return fetchJson("/api/companies/options");
  },

  getCompanyDetail(id: string): Promise<CompanyDetail> {
    return fetchJson(`/api/companies/${encodeURIComponent(id)}`);
  },

  runReconciliation(): Promise<RunReconciliationResult> {
    return fetchJson("/api/reconciliation/run", { method: "POST" });
  },

  resetReconciliation(): Promise<ResetReconciliationResult> {
    return fetchJson("/api/reconciliation/reset", { method: "POST" });
  },
};
