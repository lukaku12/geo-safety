import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Company, CompanyDetail } from "@/lib/types/domain";
import { NotFoundError, ServiceError } from "@/lib/services/errors";

/** All companies, alphabetised — used to populate the manual-match picker. */
export async function listCompanies(): Promise<Company[]> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("companies")
    .select("id, name, tax_id")
    .order("name", { ascending: true });

  if (error) throw new ServiceError(`Failed to list companies: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    taxId: row.tax_id,
  }));
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A single company plus its contracts (newest first) — the drill-down view. */
export async function getCompanyDetail(id: string): Promise<CompanyDetail> {
  // Reject malformed ids up front so a bad URL is a clean 404, not a DB 500.
  if (!UUID_RE.test(id)) throw new NotFoundError("Company not found");

  const supabase = getSupabaseServerClient();

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name, tax_id")
    .eq("id", id)
    .maybeSingle();

  if (companyError)
    throw new ServiceError(`Failed to load company: ${companyError.message}`);
  if (!company) throw new NotFoundError("Company not found");

  const { data: contracts, error: contractsError } = await supabase
    .from("contracts")
    .select("id, monthly_amount, status, start_date, end_date")
    .eq("company_id", id)
    .order("start_date", { ascending: false });

  if (contractsError)
    throw new ServiceError(
      `Failed to load contracts: ${contractsError.message}`,
    );

  return {
    id: company.id,
    name: company.name,
    taxId: company.tax_id,
    contracts: (contracts ?? []).map((row) => ({
      id: row.id,
      monthlyAmount: Number(row.monthly_amount),
      status: row.status,
      startDate: row.start_date,
      endDate: row.end_date,
    })),
  };
}
