import type { Company, Transaction } from "@/lib/types/domain";

/**
 * Suggested company for a transaction the operator is reconciling by hand.
 * Suggestions are advisory — nothing is applied without an explicit "Match".
 */
export interface CompanySuggestion {
  company: Company;
  /** Why: the sender INN equals the tax ID, or the sender name resembles it. */
  reason: "inn" | "name";
}

/**
 * Georgian legal-form tokens that carry no identity — "შპს გეოტრანსი",
 * "გეოტრანსი" and "გეოტრანსი (ფილიალი)" all denote the same counterparty.
 * "ი/მ" (sole proprietor) splits into single-letter tokens, hence "ი" and "მ".
 */
const LEGAL_FORM_TOKENS = new Set(["შპს", "სს", "ი", "მ"]);

/** Lowercase, drop parentheticals and legal forms, collapse punctuation. */
export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/gu, " ")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 0 && !LEGAL_FORM_TOKENS.has(token))
    .join(" ");
}

const MIN_NAME_LENGTH = 3;

/**
 * Best-guess company for a transaction:
 *   1. exact INN → tax ID equality (the same rule the auto-matcher uses);
 *   2. fuzzy name — normalized names equal or one contains the other, so
 *      "გეოტრანსი (ფილიალი)" suggests "შპს გეოტრანსი".
 * Returns null when nothing is convincing; a wrong suggestion is worse than
 * none, so the containment check requires a meaningful name on both sides.
 */
export function suggestCompany(
  transaction: Pick<Transaction, "senderInn" | "senderName">,
  companies: readonly Company[],
): CompanySuggestion | null {
  const inn = transaction.senderInn?.trim();
  if (inn) {
    const byInn = companies.find((c) => c.taxId === inn);
    if (byInn) return { company: byInn, reason: "inn" };
  }

  const sender = normalizeCompanyName(transaction.senderName ?? "");
  if (sender.length < MIN_NAME_LENGTH) return null;

  const byName = companies.find((c) => {
    const name = normalizeCompanyName(c.name);
    return (
      name.length >= MIN_NAME_LENGTH &&
      (name === sender || sender.includes(name) || name.includes(sender))
    );
  });
  return byName ? { company: byName, reason: "name" } : null;
}
