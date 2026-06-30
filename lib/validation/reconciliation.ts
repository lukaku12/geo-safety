import { z } from "zod";

import { ALL_PERIODS } from "@/lib/utils/periods";

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
 * The per-company expected-vs-actual view is always scoped to one concrete
 * month — "expected" is a monthly figure, so an "all" aggregate would be
 * meaningless without dividing by the number of months.
 */
export const companyReconciliationQuerySchema = z.object({
  period: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "period must be 'YYYY-MM'"),
});

export type CompanyReconciliationQuery = z.infer<
  typeof companyReconciliationQuerySchema
>;

export function parseStatsQuery(params: URLSearchParams): StatsQuery {
  return statsQuerySchema.parse(Object.fromEntries(params.entries()));
}

export function parseCompanyReconciliationQuery(
  params: URLSearchParams,
): CompanyReconciliationQuery {
  return companyReconciliationQuerySchema.parse(
    Object.fromEntries(params.entries()),
  );
}
