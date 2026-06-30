import type { NextRequest } from "next/server";

import { updateTransaction } from "@/lib/services/transactions.service";
import { updateTransactionSchema } from "@/lib/validation/transactions";
import { handleApiError, json } from "@/lib/api/respond";

/**
 * PATCH /api/transactions/[id]
 * Apply an operator action: { action: "match", companyId } | "ignore" | "unmatch".
 */
export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const input = updateTransactionSchema.parse(body);
    const updated = await updateTransaction(id, input);
    return json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
