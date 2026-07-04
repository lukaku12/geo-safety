import { z } from "zod";

import { ALL_PERIODS } from "@/lib/utils/periods";
import { reconciliationOutcomes } from "@/lib/reconciliation/status";

/** `?period=` for the stats endpoint — a month or "all". */
export const statsQuerySchema = z.object({
  period: z
    .string()
    .refine((v) => v === ALL_PERIODS || /^\d{4}-\d{2}$/.test(v), {
      message: "period must be 'all' or 'YYYY-MM'",
    })
    .default(ALL_PERIODS),
});

export type StatsQuery = z.infer<typeof statsQuerySchema>;

/**
 * The per-company expected-vs-actual view only has data for one concrete
 * month — "expected" is a monthly figure, so an "all" aggregate would be
 * meaningless without dividing by the number of months. But `period` is a
 * *global* URL param shared with every other page (see `usePeriod`), and
 * `PeriodLink` forwards whatever value is currently selected — including
 * "all" — onto this page too. So the schema must accept the same shape as
 * every other period field ("all" or "YYYY-MM"); it's on the caller
 * (`useReconciliationTableParams`'s `isMonthPeriod` gate, the "pick a month"
 * empty state, and the service layer's 400) to require a concrete month
 * before actually fetching data. Rejecting "all" here instead throws before
 * any of that UI ever runs.
 */
export const companyReconciliationQuerySchema = z.object({
  period: z
    .string()
    .refine((v) => v === ALL_PERIODS || /^\d{4}-\d{2}$/.test(v), {
      message: "period must be 'all' or 'YYYY-MM'",
    }),
  outcome: z.enum(reconciliationOutcomes).optional(),
  q: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v ? v : undefined)),
  sort: z
    .enum([
      "name",
      "tax_id",
      "expected",
      "actual",
      "difference",
      "matched_count",
      "active_contract_count",
      "outcome",
    ])
    .default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type CompanyReconciliationQuery = z.infer<
  typeof companyReconciliationQuerySchema
>;

export function parseStatsQuery(params: URLSearchParams): StatsQuery {
  return statsQuerySchema.parse(Object.fromEntries(params.entries()));
}

export function parseCompanyReconciliationQuery(
  params: URLSearchParams | Record<string, string | undefined>,
): CompanyReconciliationQuery {
  const raw =
    params instanceof URLSearchParams
      ? Object.fromEntries(params.entries())
      : params;

  const cleaned = Object.fromEntries(
    Object.entries(raw).filter(([, v]) => v !== undefined && v !== ""),
  );

  return companyReconciliationQuerySchema.parse(cleaned);
}
