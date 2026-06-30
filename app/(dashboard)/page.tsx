import { Suspense } from "react";

import { Overview } from "@/components/dashboard/overview";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";

// Static instant-navigation prefetch; validation is opted out because the draft
// validator false-flags the `useSearchParams`-suspends-on-load pattern (see the
// repo's Next.js 16 notes).
export const unstable_instant = {
  prefetch: "static",
  unstable_disableValidation: true,
};

export const metadata = { title: "Overview" };

export default function OverviewPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Overview />
    </Suspense>
  );
}
