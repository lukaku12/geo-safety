"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ComponentPropsWithoutRef } from "react";

/**
 * Internal <Link> that preserves the selected billing period across pages.
 *
 * The period is URL state (`?period`, see `usePeriod`), so a plain <Link>
 * silently resets the month selector to its default on navigation. Every
 * internal navigation should go through this component; it forwards the
 * current `period` param (including "all") onto the target href.
 */
export function PeriodLink({
  href,
  ...props
}: Omit<ComponentPropsWithoutRef<typeof Link>, "href"> & { href: string }) {
  const searchParams = useSearchParams();
  const period = searchParams.get("period");
  const target = period
    ? `${href}?period=${encodeURIComponent(period)}`
    : href;
  return <Link href={target} {...props} />;
}
