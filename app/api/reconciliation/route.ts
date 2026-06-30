import { connection, type NextRequest } from "next/server";

import { getCompanyReconciliation } from "@/lib/services/reconciliation.service";
import { parseCompanyReconciliationQuery } from "@/lib/validation/reconciliation";
import { handleApiError, json } from "@/lib/api/respond";

/**
 * GET /api/reconciliation?period=YYYY-MM
 * Expected-vs-actual per company for one billing month.
 */
export async function GET(request: NextRequest) {
  try {
    await connection();
    const { period } = parseCompanyReconciliationQuery(
      request.nextUrl.searchParams,
    );
    const rows = await getCompanyReconciliation(period);
    return json(rows);
  } catch (error) {
    return handleApiError(error);
  }
}
