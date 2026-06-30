import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Company } from "@/lib/types/domain";
import { ServiceError } from "@/lib/services/errors";

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
