"use client";

import { Suspense, useState } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the sidebar rail (logo block + nav items) while it suspends. */
function SidebarFallback() {
  return (
    <div
      aria-hidden
      className="hidden w-60 shrink-0 border-r border-border bg-surface lg:block"
    >
      <div className="flex flex-col gap-6 p-4">
        <div className="flex items-center gap-2 px-2 py-1">
          <Skeleton className="h-8 w-8" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Mirrors the topbar (title + period select + action buttons). */
function TopbarFallback() {
  return (
    <div
      aria-hidden
      className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface/80 px-4 sm:px-6"
    >
      <Skeleton className="h-6 w-32" />
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-10 sm:w-24" />
        <Skeleton className="h-10 w-10 sm:w-40" />
      </div>
    </div>
  );
}

/**
 * Client shell: owns the mobile-drawer state and frames every page with the
 * sidebar + top bar. Sidebar and Topbar read `useSearchParams`/`usePathname`,
 * which suspend during prerender under Cache Components, so each sits behind its
 * own <Suspense> — the page content (with its own boundary) is never gated by
 * the chrome.
 *
 * The shell is locked to the viewport height: the document never scrolls.
 * Table pages size themselves to `h-full` and scroll inside the table region;
 * flowing pages (overview, company detail) scroll inside <main>.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden">
      <Suspense fallback={<SidebarFallback />}>
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      </Suspense>

      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={<TopbarFallback />}>
          <Topbar onMenuClick={() => setMobileOpen(true)} />
        </Suspense>

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
