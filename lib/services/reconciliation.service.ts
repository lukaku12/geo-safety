import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CompanyReconciliation,
  Paginated,
  ReconciliationStats,
  ResetReconciliationResult,
  RunReconciliationResult,
} from "@/lib/types/domain";
import type { CompanyReconciliationQuery } from "@/lib/validation/reconciliation";
import { getPeriodRange, type PeriodKey } from "@/lib/utils/periods";
import { deriveOutcome, OUTCOME_LABELS } from "@/lib/reconciliation/status";
import { ServiceError } from "@/lib/services/errors";

/**
 * Runs the INN auto-match. The heavy lifting is the single set-based UPDATE
 * inside `reconcile_by_inn()`; here we just invoke it and shape the result.
 */
export async function runReconciliation(): Promise<RunReconciliationResult> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase.rpc("reconcile_by_inn");
  if (error) throw new ServiceError(`Reconciliation failed: ${error.message}`);

  const row = data?.[0];
  return {
    matchedCount: row?.matched_count ?? 0,
    unmatchedCount: row?.unmatched_count ?? 0,
    totalProcessed: row?.total_processed ?? 0,
  };
}

/**
 * Restore the seeded state: every transaction back to `unmatched` with its
 * match metadata cleared. A single set-based UPDATE scoped to rows that have
 * drifted from seed (anything not already `unmatched`), so the returned count
 * reflects exactly what changed. Undoes both auto- and manual reconciliation.
 */
export async function resetReconciliation(): Promise<ResetReconciliationResult> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("bank_transactions")
    .update({
      matched_company_id: null,
      match_method: null,
      match_confidence: null,
      status: "unmatched",
    })
    .neq("status", "unmatched")
    .select("id");

  if (error) throw new ServiceError(`Reset failed: ${error.message}`);

  return { resetCount: data?.length ?? 0 };
}

export async function getStats(
  period: PeriodKey,
): Promise<ReconciliationStats> {
  const supabase = getSupabaseServerClient();
  const { start, end } = getPeriodRange(period);

  const { data, error } = await supabase.rpc("reconciliation_stats", {
    p_period_start: start,
    p_period_end: end,
  });
  if (error) throw new ServiceError(`Failed to load stats: ${error.message}`);

  const row = data?.[0];
  const matchedCount = Number(row?.matched_count ?? 0);
  const unmatchedCount = Number(row?.unmatched_count ?? 0);
  const reconcilable = matchedCount + unmatchedCount;

  return {
    totalCount: Number(row?.total_count ?? 0),
    matchedCount,
    unmatchedCount,
    ignoredCount: Number(row?.ignored_count ?? 0),
    totalAmount: Number(row?.total_amount ?? 0),
    matchedAmount: Number(row?.matched_amount ?? 0),
    unmatchedAmount: Number(row?.unmatched_amount ?? 0),
    matchRate: reconcilable === 0 ? 0 : matchedCount / reconcilable,
  };
}

export async function getCompanyReconciliation(
  query: CompanyReconciliationQuery,
): Promise<Paginated<CompanyReconciliation>> {
  const supabase = getSupabaseServerClient();
  const { period, outcome, q, sort, order, page, pageSize } = query;
  const { start, end } = getPeriodRange(period);

  if (!start || !end) {
    throw new ServiceError("A concrete month is required for this view", 400);
  }

  const { data, error } = await supabase.rpc("company_reconciliation", {
    p_period_start: start,
    p_period_end: end,
  });
  if (error)
    throw new ServiceError(`Failed to load reconciliation: ${error.message}`);

  let rows = (data ?? []).map((row) => {
    const expected = Number(row.expected);
    const actual = Number(row.actual);
    const activeContractCount = Number(row.active_contract_count);

    return {
      companyId: row.company_id,
      name: row.name,
      taxId: row.tax_id,
      expected,
      actual,
      difference: actual - expected,
      matchedCount: Number(row.matched_count),
      activeContractCount,
      outcome: deriveOutcome({ expected, actual, activeContractCount }),
    } satisfies CompanyReconciliation;
  });

  if (q) {
    const term = q.toLowerCase();
    rows = rows.filter(
      (row) =>
        row.name.toLowerCase().includes(term) ||
        row.taxId.toLowerCase().includes(term),
    );
  }

  if (outcome) rows = rows.filter((row) => row.outcome === outcome);

  const collator = new Intl.Collator("en", {
    numeric: true,
    sensitivity: "base",
  });
  rows = [...rows].sort((a, b) => {
    const sign = order === "asc" ? 1 : -1;
    let result: number;
    switch (sort) {
      case "name":
        result = collator.compare(a.name, b.name);
        break;
      case "tax_id":
        result = collator.compare(a.taxId, b.taxId);
        break;
      case "expected":
        result = a.expected - b.expected;
        break;
      case "actual":
        result = a.actual - b.actual;
        break;
      case "difference":
        result = a.difference - b.difference;
        break;
      case "matched_count":
        result = a.matchedCount - b.matchedCount;
        break;
      case "active_contract_count":
        result = a.activeContractCount - b.activeContractCount;
        break;
      case "outcome":
        result = collator.compare(
          OUTCOME_LABELS[a.outcome],
          OUTCOME_LABELS[b.outcome],
        );
        break;
    }

    return result === 0 ? collator.compare(a.companyId, b.companyId) : sign * result;
  });

  const total = rows.length;
  const from = (page - 1) * pageSize;

  return {
    items: rows.slice(from, from + pageSize),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
