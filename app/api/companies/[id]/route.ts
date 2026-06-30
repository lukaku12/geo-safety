import { connection, type NextRequest } from "next/server";

import { getCompanyDetail } from "@/lib/services/companies.service";
import { handleApiError, json } from "@/lib/api/respond";

/** GET /api/companies/[id] — a company plus its contracts (drill-down view). */
export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await connection();
    const { id } = await ctx.params;
    const detail = await getCompanyDetail(id);
    return json(detail);
  } catch (error) {
    return handleApiError(error);
  }
}
