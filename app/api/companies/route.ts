import { connection } from "next/server";
import type { NextRequest } from "next/server";

import { listCompanies } from "@/lib/services/companies.service";
import { parseCompanyQuery } from "@/lib/validation/companies";
import { handleApiError, json } from "@/lib/api/respond";

/** GET /api/companies — filtered/sorted/paginated company directory. */
export async function GET(request: NextRequest) {
  try {
    await connection();
    const query = parseCompanyQuery(request.nextUrl.searchParams);
    const companies = await listCompanies(query);
    return json(companies);
  } catch (error) {
    return handleApiError(error);
  }
}
