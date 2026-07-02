import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { Paginated, Transaction } from "@/lib/types/domain";
import type {
  TransactionQuery,
  UpdateTransactionInput,
} from "@/lib/validation/transactions";
import { getPeriodRange } from "@/lib/utils/periods";
import { NotFoundError, ServiceError } from "@/lib/services/errors";

/**
 * The embedded company is selected via the single FK from bank_transactions →
 * companies and aliased to `matched_company`. Selecting only the columns we
 * render keeps the payload small.
 */
const SELECT = "*, matched_company:companies(id, name, tax_id)" as const;

type TransactionRow =
  Database["public"]["Tables"]["bank_transactions"]["Row"] & {
    matched_company: { id: string; name: string; tax_id: string } | null;
  };

function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    docKey: row.doc_key,
    entryDate: row.entry_date,
    amount: Number(row.amount),
    currency: row.currency,
    senderName: row.sender_name,
    senderInn: row.sender_inn,
    senderAccount: row.sender_account,
    purpose: row.purpose,
    status: row.status,
    matchMethod: row.match_method,
    matchConfidence:
      row.match_confidence === null ? null : Number(row.match_confidence),
    matchedCompany: row.matched_company
      ? {
          id: row.matched_company.id,
          name: row.matched_company.name,
          taxId: row.matched_company.tax_id,
        }
      : null,
    updatedAt: row.updated_at,
  };
}

/** PostgREST `or()` is comma/paren-delimited; strip those from user input. */
function sanitizeSearch(term: string): string {
  return term.replace(/[(),]/g, " ").trim();
}

export async function listTransactions(
  query: TransactionQuery,
): Promise<Paginated<Transaction>> {
  const supabase = getSupabaseServerClient();
  const { status, q, period, sort, order, page, pageSize } = query;

  let builder = supabase
    .from("bank_transactions")
    .select(SELECT, { count: "exact" });

  if (status) builder = builder.eq("status", status);

  const { start, end } = getPeriodRange(period);
  if (start) builder = builder.gte("entry_date", start);
  if (end) builder = builder.lte("entry_date", end);

  if (q) {
    const term = sanitizeSearch(q);
    if (term) {
      builder = builder.or(
        `sender_name.ilike.%${term}%,sender_inn.ilike.%${term}%,purpose.ilike.%${term}%`,
      );
    }
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Secondary sort by id keeps pagination deterministic when the primary key
  // (e.g. amount or date) has ties.
  const { data, error, count } = await builder
    .order(sort, { ascending: order === "asc", nullsFirst: false })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) throw new ServiceError(`Failed to list transactions: ${error.message}`);

  const total = count ?? 0;
  return {
    items: (data as TransactionRow[]).map(toTransaction),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function updateTransaction(
  id: string,
  input: UpdateTransactionInput,
): Promise<Transaction> {
  const supabase = getSupabaseServerClient();

  // Each action maps to an explicit column set so we never leave a row in a
  // half-updated state (e.g. status='matched' with a null company).
  const patch: Database["public"]["Tables"]["bank_transactions"]["Update"] =
    input.action === "match"
      ? {
          matched_company_id: input.companyId,
          match_method: "manual",
          match_confidence: 1.0,
          status: "matched",
        }
      : input.action === "ignore"
        ? {
            status: "ignored",
            matched_company_id: null,
            match_method: null,
            match_confidence: null,
          }
        : {
            status: "unmatched",
            matched_company_id: null,
            match_method: null,
            match_confidence: null,
          };

  const { data, error } = await supabase
    .from("bank_transactions")
    .update(patch)
    .eq("id", id)
    .select(SELECT)
    .maybeSingle();

  if (error) {
    // 23503 = FK violation → the company id doesn't exist.
    if (error.code === "23503") {
      throw new ServiceError("Unknown company", 422);
    }
    throw new ServiceError(`Failed to update transaction: ${error.message}`);
  }
  if (!data) throw new NotFoundError("Transaction not found");

  return toTransaction(data as TransactionRow);
}
