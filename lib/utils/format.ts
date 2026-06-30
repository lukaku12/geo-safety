/**
 * Presentation helpers. All money is formatted with tabular figures in mind;
 * pair these with the `tabular-nums` utility so columns line up.
 */

const GEL_SYMBOL = "₾";

const decimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const signedDecimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** `1500` → `"1,500.00 ₾"`. Non-GEL currencies keep their ISO code. */
export function formatCurrency(amount: number, currency = "GEL"): string {
  const value = decimalFormatter.format(amount);
  return currency === "GEL" ? `${value} ${GEL_SYMBOL}` : `${value} ${currency}`;
}

/** Like {@link formatCurrency} but always shows the sign, for deltas. */
export function formatSignedCurrency(amount: number, currency = "GEL"): string {
  const value = signedDecimalFormatter.format(amount);
  return currency === "GEL" ? `${value} ${GEL_SYMBOL}` : `${value} ${currency}`;
}

/** `0.8421` → `"84.2%"`. */
export function formatPercent(ratio: number, fractionDigits = 1): string {
  return `${(ratio * 100).toFixed(fractionDigits)}%`;
}

/** `"2026-04-03"` → `"03 Apr 2026"`. */
export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(`${isoDate}T00:00:00Z`));
}

/** `"2026-04"` → `"April 2026"`. */
export function formatMonth(yearMonth: string): string {
  return monthFormatter.format(new Date(`${yearMonth}-01T00:00:00Z`));
}
