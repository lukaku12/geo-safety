"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DEFAULT_PERIOD, type PeriodKey } from "@/lib/utils/periods";

/**
 * Global billing-period state, shared by every page through the `?period` URL
 * param. Keeping it in the URL means the selected month survives navigation
 * between pages, refreshes, and sharing. Changing the period drops `page` so
 * pagination resets — matching `useDashboardParams`'s behavior on the
 * transactions page (both read/write the same param).
 */
export function usePeriod() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const period = useMemo<PeriodKey>(
    () => searchParams.get("period") ?? DEFAULT_PERIOD,
    [searchParams],
  );

  const setPeriod = useCallback(
    (next: PeriodKey) => {
      const params = new URLSearchParams(searchParams);
      params.set("period", next);
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  return { period, setPeriod };
}
