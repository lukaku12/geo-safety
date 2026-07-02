"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  parseCompanyQuery,
  type CompanyQuery,
} from "@/lib/validation/companies";
import {
  parseCompanyReconciliationQuery,
  type CompanyReconciliationQuery,
} from "@/lib/validation/reconciliation";
import { DEFAULT_PERIOD } from "@/lib/utils/periods";

type CompanyUpdate = Partial<CompanyQuery>;
type ReconciliationUpdate = Partial<CompanyReconciliationQuery>;

function useUrlPatch<TUpdate extends object>() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(
    (updates: TUpdate) => {
      const next = new URLSearchParams(searchParams);

      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === null || value === "") {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }

      const changedFilters = Object.keys(updates).some((key) => key !== "page");
      if (changedFilters && !("page" in updates)) next.delete("page");

      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname],
  );
}

export function useCompanyTableParams() {
  const searchParams = useSearchParams();
  const query = useMemo<CompanyQuery>(() => {
    return parseCompanyQuery(Object.fromEntries(searchParams.entries()));
  }, [searchParams]);
  const patch = useUrlPatch<CompanyUpdate>();

  const toggleSort = useCallback(
    (field: CompanyQuery["sort"]) => {
      patch(
        query.sort === field
          ? { sort: field, order: query.order === "asc" ? "desc" : "asc" }
          : { sort: field, order: "asc" },
      );
    },
    [patch, query.sort, query.order],
  );

  return { query, patch, toggleSort };
}

export function useReconciliationTableParams() {
  const searchParams = useSearchParams();
  const query = useMemo<CompanyReconciliationQuery>(() => {
    const record = Object.fromEntries(searchParams.entries());
    if (!record.period) record.period = DEFAULT_PERIOD;
    return parseCompanyReconciliationQuery(record);
  }, [searchParams]);
  const patch = useUrlPatch<ReconciliationUpdate>();

  const toggleSort = useCallback(
    (field: CompanyReconciliationQuery["sort"]) => {
      const nextOrder =
        query.sort === field
          ? query.order === "asc"
            ? "desc"
            : "asc"
          : field === "name" || field === "tax_id" || field === "outcome"
            ? "asc"
            : "desc";

      patch({ sort: field, order: nextOrder });
    },
    [patch, query.sort, query.order],
  );

  return { query, patch, toggleSort };
}
