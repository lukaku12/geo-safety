import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 Cache Components: enables Partial Prerendering (PPR) and the
  // `use cache` / `cacheLife` / `cacheTag` model. With this on, any uncached
  // server data access outside a <Suspense> boundary is a build-time error,
  // which keeps our static shells honest. See docs/01-app/getting-started/caching.
  cacheComponents: true,

  // Fail the production build on type errors instead of shipping them.
  typescript: { ignoreBuildErrors: false },

  experimental: {
    // Surface the Instant Navigation overlay in dev so we can verify that
    // routes annotated with `unstable_instant` produce an instant static shell.
    instantNavigationDevToolsToggle: true,
  },
};

export default nextConfig;
