/**
 * Billing-period helpers. A period is either a single month (`"YYYY-MM"`) or
 * the special value `"all"` meaning "no date filter".
 */

export const ALL_PERIODS = "all" as const;

export type PeriodKey = string; // "YYYY-MM" | "all"

export interface PeriodOption {
  key: PeriodKey;
  label: string;
}

/**
 * Months covered by the seed data (Apr–Jun 2026). In production this list would
 * be derived from `min(entry_date)`..`max(entry_date)`; it is a constant here so
 * the dashboard has stable, reviewable options without an extra round-trip.
 */
export const DATASET_MONTHS: readonly string[] = [
  "2026-04",
  "2026-05",
  "2026-06",
] as const;

/** Default selection: the most recent month with data. */
export const DEFAULT_PERIOD: PeriodKey =
  DATASET_MONTHS[DATASET_MONTHS.length - 1];

export function isMonthPeriod(key: PeriodKey): boolean {
  return /^\d{4}-\d{2}$/.test(key);
}

/** Inclusive `[start, end]` ISO dates for a period, or `null`s for `"all"`. */
export function getPeriodRange(key: PeriodKey): {
  start: string | null;
  end: string | null;
} {
  if (!isMonthPeriod(key)) return { start: null, end: null };

  const [year, month] = key.split("-").map(Number);
  const start = `${key}-01`;
  // Day 0 of the next month is the last day of this month (UTC, no TZ drift).
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const end = `${key}-${String(lastDay).padStart(2, "0")}`;

  return { start, end };
}

const monthLabelFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function getPeriodOptions(): PeriodOption[] {
  return [
    { key: ALL_PERIODS, label: "All periods" },
    ...DATASET_MONTHS.map((m) => ({
      key: m,
      label: monthLabelFormatter.format(new Date(`${m}-01T00:00:00Z`)),
    })),
  ];
}
