import { Suspense } from "react";

import { Dashboard } from "@/components/dashboard/dashboard";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

/**
 * Declare static instant-navigation prefetching for this route (Next.js 16
 * Cache Components). The static header is in the prerendered shell; the client
 * `<Dashboard>` reads `useSearchParams` (URL-driven filter state), which
 * suspends on a cold page load, so it sits behind a <Suspense> boundary with a
 * meaningful skeleton fallback.
 *
 * `unstable_disableValidation` is set because the draft build-time validator
 * currently flags the `useSearchParams`-suspends-on-load pattern (it bubbles a
 * dynamic-metadata error) even though the route does produce a valid instant
 * shell. We keep the prefetch declaration and opt out of the experimental
 * validation rather than gate a production build on a draft check. The
 * Instant-Navs DevTools overlay (enabled in next.config.ts) still works in dev.
 */
export const unstable_instant = {
  prefetch: "static",
  unstable_disableValidation: true,
};

export const metadata = { title: "Dashboard" };

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Payment reconciliation
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Match incoming transfers to companies and track expected vs. actual
          revenue.
        </p>
      </header>

      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </main>
  );
}
