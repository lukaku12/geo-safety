import { z } from "zod";

import { ALL_PERIODS } from "@/lib/utils/periods";

/**
 * Validation + parsing for the transactions API. The same schemas are reused on
 * the client (to build typed query params) and on the server (to validate
 * untrusted input), so the contract can never drift between the two.
 */

export const transactionStatusSchema = z.enum([
  "matched",
  "unmatched",
  "ignored",
]);

export const sortFieldSchema = z.enum([
  "entry_date",
  "sender_name",
  "amount",
  "status",
]);
export const sortOrderSchema = z.enum(["asc", "desc"]);

const periodSchema = z
  .string()
  .refine((v) => v === ALL_PERIODS || /^\d{4}-\d{2}$/.test(v), {
    message: "period must be 'all' or 'YYYY-MM'",
  });

/** Filters/sort/pagination for `GET /api/transactions`. */
export const transactionQuerySchema = z.object({
  status: transactionStatusSchema.optional(),
  q: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v ? v : undefined)),
  period: periodSchema.default(ALL_PERIODS),
  sort: sortFieldSchema.default("entry_date"),
  order: sortOrderSchema.default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type TransactionQuery = z.infer<typeof transactionQuerySchema>;

/**
 * Body for `PATCH /api/transactions/[id]`. A discriminated union makes the
 * three operator actions mutually exclusive and self-documenting:
 *   - match:   manually attach a company
 *   - ignore:  exclude the transfer from reconciliation
 *   - unmatch: reset back to unmatched (clears any match)
 */
export const updateTransactionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("match"),
    // guid, not uuid: Zod 4's z.uuid() enforces RFC 4122 variant bits, which
    // the seeded (hand-crafted) company ids don't all carry. The FK constraint
    // is the real existence check; this only guards the shape.
    companyId: z.guid(),
  }),
  z.object({ action: z.literal("ignore") }),
  z.object({ action: z.literal("unmatch") }),
]);

export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

/** Parse a `URLSearchParams` (or a plain record) into a validated query. */
export function parseTransactionQuery(
  params: URLSearchParams | Record<string, string | undefined>,
): TransactionQuery {
  const raw =
    params instanceof URLSearchParams
      ? Object.fromEntries(params.entries())
      : params;

  // Drop empty strings so schema defaults apply instead of failing coercion.
  const cleaned = Object.fromEntries(
    Object.entries(raw).filter(([, v]) => v !== undefined && v !== ""),
  );

  return transactionQuerySchema.parse(cleaned);
}
