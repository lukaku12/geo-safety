import { runReconciliation } from "@/lib/services/reconciliation.service";
import { handleApiError, json } from "@/lib/api/respond";

/**
 * POST /api/reconciliation/run
 * Trigger the INN auto-match (idempotent — only touches unmatched rows).
 */
export async function POST() {
  try {
    const result = await runReconciliation();
    return json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
