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
 * The per-company expected-vs-actual view is always scoped to one concrete
 * month — "expected" is a monthly figure, so an "all" aggregate would be
 * meaningless without dividing by the number of months.
 */
export const companyReconciliationQuerySchema = z.object({
  period: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "period must be 'YYYY-MM'"),
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
