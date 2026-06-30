import {
  LayoutDashboard,
  ArrowLeftRight,
  Scale,
  Building2,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Sidebar destinations, in order. Also drives the top-bar page title. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/reconciliation", label: "Reconciliation", icon: Scale },
  { href: "/companies", label: "Companies", icon: Building2 },
];

/** Longest-prefix match so e.g. `/companies/abc` still resolves to "Companies". */
export function titleForPath(pathname: string): string {
  const match = [...NAV_ITEMS]
    .filter((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label ?? "Dashboard";
}
