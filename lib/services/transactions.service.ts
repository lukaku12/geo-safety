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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * PostgREST `or()` is comma/paren-delimited — strip those. `ilike` treats
 * `%`, `_` and `\` as pattern syntax — escape them so input matches literally
 * (searching "100%" means the text "100%", not the prefix "100").
 */
function sanitizeSearch(term: string): string {
  return term
    .replace(/[(),]/g, " ")
    .replace(/[\\%_]/g, "\\$&")
    .trim();
}

export async function listTransactions(
  query: TransactionQuery,
): Promise<Paginated<Transaction>> {
  const supabase = getSupabaseServerClient();
  const { status, q, period, sort, order, page, pageSize } = query;
  const { start, end } = getPeriodRange(period);

  // Shared by the main query and the out-of-range fallback below, so the
  // filters can never drift between the two.
  function filtered<Q extends string>(
    select: Q,
    opts?: { count: "exact"; head?: boolean },
  ) {
    let builder = supabase.from("bank_transactions").select(select, opts);
    if (status) builder = builder.eq("status", status);
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
    return builder;
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Secondary sort by id keeps pagination deterministic when the primary key
  // (e.g. amount or date) has ties.
  const { data, error, count } = await filtered(SELECT, { count: "exact" })
    .order(sort, { ascending: order === "asc", nullsFirst: false })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) {
    // PostgREST 416s ("Requested range not satisfiable") when `from` is past
    // the last row for the filtered set — reachable via a stale/bookmarked
    // page, or a mutation (auto-match, ignore) that shrinks the result set
    // out from under the page the user is sitting on. Recover with the true
    // count instead of a raw 500; the pagination bar clamps and self-corrects
    // on the next click.
    if (error.code === "PGRST103") {
      const { count: total, error: countError } = await filtered("id", {
        count: "exact",
        head: true,
      });
      if (countError) {
        throw new ServiceError(
          `Failed to list transactions: ${countError.message}`,
        );
      }
      return {
        items: [],
        page,
        pageSize,
        total: total ?? 0,
        totalPages: Math.max(1, Math.ceil((total ?? 0) / pageSize)),
      };
    }
    throw new ServiceError(`Failed to list transactions: ${error.message}`);
  }

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
  // Reject malformed ids up front so a bad id is a clean 404, not a DB 500
  // (Postgres throws a raw type-cast error for a non-UUID in a uuid column).
  if (!UUID_RE.test(id)) throw new NotFoundError("Transaction not found");

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
