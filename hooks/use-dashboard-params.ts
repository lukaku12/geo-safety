"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  parseTransactionQuery,
  type TransactionQuery,
} from "@/lib/validation/transactions";
import { DEFAULT_PERIOD } from "@/lib/utils/periods";

type FilterUpdate = Partial<
  Pick<TransactionQuery, "status" | "q" | "period" | "sort" | "order" | "page">
>;

/**
 * Dashboard filter state lives in the URL — shareable, bookmarkable, and
 * survives refreshes/back-navigation. The same Zod schema that guards the API
 * parses the params here, so the client can never construct an invalid query.
 */
export function useDashboardParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const query = useMemo<TransactionQuery>(() => {
    const record: Record<string, string> = Object.fromEntries(
      searchParams.entries(),
    );
    // Dashboard default is the latest month, not the API's "all".
    if (!record.period) record.period = DEFAULT_PERIOD;
    return parseTransactionQuery(record);
  }, [searchParams]);

  const patch = useCallback(
    (updates: FilterUpdate) => {
      const next = new URLSearchParams(searchParams);

      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === null || value === "") {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }

      // Changing any filter resets pagination to the first page.
      const changedFilters = Object.keys(updates).some((k) => k !== "page");
      if (changedFilters && !("page" in updates)) next.delete("page");

      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  /** Click a column header: same field flips direction, new field starts desc. */
  const toggleSort = useCallback(
    (field: TransactionQuery["sort"]) => {
      patch(
        query.sort === field
          ? { sort: field, order: query.order === "asc" ? "desc" : "asc" }
          : { sort: field, order: "desc" },
      );
    },
    [patch, query.sort, query.order],
  );

  return { query, patch, toggleSort };
}

export type UseDashboardParams = ReturnType<typeof useDashboardParams>;
