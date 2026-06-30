import type {
  Company,
  CompanyDetail,
  CompanyReconciliation,
  Paginated,
  ReconciliationStats,
  RunReconciliationResult,
  Transaction,
} from "@/lib/types/domain";
import type {
  TransactionQuery,
  UpdateTransactionInput,
} from "@/lib/validation/transactions";
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

function toSearchParams(query: TransactionQuery): string {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.q) params.set("q", query.q);
  params.set("period", query.period);
  params.set("sort", query.sort);
  params.set("order", query.order);
  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));
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

  getCompanyReconciliation(period: string): Promise<CompanyReconciliation[]> {
    return fetchJson(`/api/reconciliation?period=${encodeURIComponent(period)}`);
  },

  getCompanies(): Promise<Company[]> {
    return fetchJson("/api/companies");
  },

  getCompanyDetail(id: string): Promise<CompanyDetail> {
    return fetchJson(`/api/companies/${encodeURIComponent(id)}`);
  },

  runReconciliation(): Promise<RunReconciliationResult> {
    return fetchJson("/api/reconciliation/run", { method: "POST" });
  },
};
