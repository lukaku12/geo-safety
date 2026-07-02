import type { ReconciliationOutcome } from "@/lib/types/domain";

/**
 * Single source of truth for the expected-vs-actual verdict.
 *
 *   expected = Σ active contract monthly_amount for the period
 *   actual   = Σ matched transactions for the period
 *
 * A small tolerance absorbs NUMERIC rounding so an exact payment never shows as
 * over/underpaid. Zero-payment companies get their own outcomes ("unpaid" when
 * a contract billed, "inactive" when none did) — the brief renders both grey,
 * distinct from a partial underpayment.
 */
const ROUNDING_TOLERANCE = 0.005;

export function deriveOutcome(params: {
  expected: number;
  actual: number;
  activeContractCount: number;
}): ReconciliationOutcome {
  const { expected, actual, activeContractCount } = params;

  if (actual === 0) {
    if (activeContractCount === 0) return "inactive";
    if (expected > 0) return "unpaid";
  }

  const difference = actual - expected;
  if (Math.abs(difference) <= ROUNDING_TOLERANCE) return "ok";
  return difference < 0 ? "underpaid" : "overpaid";
}

export const OUTCOME_LABELS: Record<ReconciliationOutcome, string> = {
  ok: "On track",
  underpaid: "Underpaid",
  overpaid: "Overpaid",
  unpaid: "No payments",
  inactive: "No active contract",
};

export const reconciliationOutcomes = [
  "ok",
  "underpaid",
  "overpaid",
  "unpaid",
  "inactive",
] as const satisfies readonly ReconciliationOutcome[];
