import { resetReconciliation } from "@/lib/services/reconciliation.service";
import { handleApiError, json } from "@/lib/api/respond";

/**
 * POST /api/reconciliation/reset
 * Restore every transaction to its seeded `unmatched` state (demo reset).
 */
export async function POST() {
  try {
    const result = await resetReconciliation();
    return json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
