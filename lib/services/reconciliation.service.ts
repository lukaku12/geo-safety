import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CompanyReconciliation,
  ReconciliationStats,
  RunReconciliationResult,
} from "@/lib/types/domain";
import { getPeriodRange, type PeriodKey } from "@/lib/utils/periods";
import { deriveOutcome } from "@/lib/reconciliation/status";
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
  period: string, // concrete "YYYY-MM"
): Promise<CompanyReconciliation[]> {
  const supabase = getSupabaseServerClient();
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

  return (data ?? []).map((row) => {
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
}
