import { connection } from "next/server";

import { listCompanies } from "@/lib/services/companies.service";
import { handleApiError, json } from "@/lib/api/respond";

/** GET /api/companies — list for the manual-match picker. */
export async function GET() {
  try {
    await connection();
    const companies = await listCompanies();
    return json(companies);
  } catch (error) {
    return handleApiError(error);
  }
}
