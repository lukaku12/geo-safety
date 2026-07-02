import { connection } from "next/server";

import { listCompanyOptions } from "@/lib/services/companies.service";
import { handleApiError, json } from "@/lib/api/respond";

/** GET /api/companies/options — full alphabetised list for match selectors. */
export async function GET() {
  try {
    await connection();
    const companies = await listCompanyOptions();
    return json(companies);
  } catch (error) {
    return handleApiError(error);
  }
}
