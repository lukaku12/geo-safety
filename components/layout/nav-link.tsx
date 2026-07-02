"use client";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";
import { PeriodLink } from "@/components/layout/period-link";
import type { NavItem } from "@/components/layout/nav-items";

/**
 * Sidebar link with active state. Renders through `PeriodLink` so switching
 * pages keeps the selected month (see `usePeriod`).
 */
export function NavLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const active =
    item.href === "/"
      ? pathname === "/"
      : pathname.startsWith(item.href);

  const Icon = item.icon;

  return (
    <PeriodLink
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {item.label}
    </PeriodLink>
  );
}
