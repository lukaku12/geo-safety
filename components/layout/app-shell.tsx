"use client";

import { Suspense, useState } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

/**
 * Client shell: owns the mobile-drawer state and frames every page with the
 * sidebar + top bar. Sidebar and Topbar read `useSearchParams`/`usePathname`,
 * which suspend during prerender under Cache Components, so each sits behind its
 * own <Suspense> — the page content (with its own boundary) is never gated by
 * the chrome.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      <Suspense fallback={<div className="hidden w-60 shrink-0 border-r border-border bg-surface lg:block" />}>
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      </Suspense>

      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={<div className="h-16 border-b border-border bg-surface" />}>
          <Topbar onMenuClick={() => setMobileOpen(true)} />
        </Suspense>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
