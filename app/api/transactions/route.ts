import { connection, type NextRequest } from "next/server";

import { listTransactions } from "@/lib/services/transactions.service";
import { parseTransactionQuery } from "@/lib/validation/transactions";
import { handleApiError, json } from "@/lib/api/respond";

/**
 * GET /api/transactions
 * Filter (status, period, full-text q), sort, and paginate bank transactions.
 * `connection()` opts this handler into request-time execution under Cache
 * Components, so it never runs against the database during the build.
 */
export async function GET(request: NextRequest) {
  try {
    await connection();
    const query = parseTransactionQuery(request.nextUrl.searchParams);
    const result = await listTransactions(query);
    return json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
