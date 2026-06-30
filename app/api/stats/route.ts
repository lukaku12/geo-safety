import { connection, type NextRequest } from "next/server";

import { getStats } from "@/lib/services/reconciliation.service";
import { parseStatsQuery } from "@/lib/validation/reconciliation";
import { handleApiError, json } from "@/lib/api/respond";

/** GET /api/stats?period=YYYY-MM|all — headline reconciliation numbers. */
export async function GET(request: NextRequest) {
  try {
    await connection();
    const { period } = parseStatsQuery(request.nextUrl.searchParams);
    const stats = await getStats(period);
    return json(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
