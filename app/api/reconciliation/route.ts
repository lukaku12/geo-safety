import { connection, type NextRequest } from "next/server";

import { getCompanyReconciliation } from "@/lib/services/reconciliation.service";
import { parseCompanyReconciliationQuery } from "@/lib/validation/reconciliation";
import { handleApiError, json } from "@/lib/api/respond";

/**
 * GET /api/reconciliation?period=YYYY-MM
 * Filter, sort, and paginate expected-vs-actual rows for one billing month.
 */
export async function GET(request: NextRequest) {
  try {
    await connection();
    const query = parseCompanyReconciliationQuery(request.nextUrl.searchParams);
    const rows = await getCompanyReconciliation(query);
    return json(rows);
  } catch (error) {
    return handleApiError(error);
  }
}
