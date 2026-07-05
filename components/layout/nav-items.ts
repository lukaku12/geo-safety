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
  /** One-liner under the top-bar title — the page's only description. */
  description: string;
  icon: LucideIcon;
}

/** Sidebar destinations, in order. Also drives the top-bar title + description. */
export const NAV_ITEMS: readonly NavItem[] = [
  {
    href: "/",
    label: "Overview",
    description: "Reconciliation health for the selected billing period.",
    icon: LayoutDashboard,
  },
  {
    href: "/transactions",
    label: "Transactions",
    description: "Review incoming transfers and reconcile them with companies.",
    icon: ArrowLeftRight,
  },
  {
    href: "/reconciliation",
    label: "Reconciliation",
    description: "Compare each company's contracted amount with its payments.",
    icon: Scale,
  },
  {
    href: "/companies",
    label: "Companies",
    description:
      "All contracted companies and their billing status for the selected month.",
    icon: Building2,
  },
];

/** Longest-prefix match so e.g. `/companies/abc` still resolves to "Companies". */
function itemForPath(pathname: string): NavItem | undefined {
  return [...NAV_ITEMS]
    .filter((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];
}

export function titleForPath(pathname: string): string {
  return itemForPath(pathname)?.label ?? "Dashboard";
}

export function descriptionForPath(pathname: string): string | undefined {
  return itemForPath(pathname)?.description;
}
