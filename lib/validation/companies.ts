import { z } from "zod";

export const companySortFieldSchema = z.enum(["name", "tax_id"]);
export const companySortOrderSchema = z.enum(["asc", "desc"]);

/** Filters/sort/pagination for `GET /api/companies`. */
export const companyQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v ? v : undefined)),
  sort: companySortFieldSchema.default("name"),
  order: companySortOrderSchema.default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type CompanyQuery = z.infer<typeof companyQuerySchema>;

/** Parse a `URLSearchParams` (or a plain record) into a validated query. */
export function parseCompanyQuery(
  params: URLSearchParams | Record<string, string | undefined>,
): CompanyQuery {
  const raw =
    params instanceof URLSearchParams
      ? Object.fromEntries(params.entries())
      : params;

  const cleaned = Object.fromEntries(
    Object.entries(raw).filter(([, v]) => v !== undefined && v !== ""),
  );

  return companyQuerySchema.parse(cleaned);
}
