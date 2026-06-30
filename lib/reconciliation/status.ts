import type { ReconciliationOutcome } from "@/lib/types/domain";

/**
 * Single source of truth for the expected-vs-actual verdict.
 *
 *   expected = Σ active contract monthly_amount for the period
 *   actual   = Σ matched transactions for the period
 *
 * A small tolerance absorbs NUMERIC rounding so an exact payment never shows as
 * over/underpaid. "inactive" flags companies with no active contract that also
 * received nothing — distinct from a real underpayment.
 */
const ROUNDING_TOLERANCE = 0.005;

export function deriveOutcome(params: {
  expected: number;
  actual: number;
  activeContractCount: number;
}): ReconciliationOutcome {
  const { expected, actual, activeContractCount } = params;

  if (activeContractCount === 0 && actual === 0) return "inactive";

  const difference = actual - expected;
  if (Math.abs(difference) <= ROUNDING_TOLERANCE) return "ok";
  return difference < 0 ? "underpaid" : "overpaid";
}

export const OUTCOME_LABELS: Record<ReconciliationOutcome, string> = {
  ok: "On track",
  underpaid: "Underpaid",
  overpaid: "Overpaid",
  inactive: "No active contract",
};
