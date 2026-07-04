import { Suspense } from "react";

import { CompanyDetail } from "@/components/dashboard/company-detail";
import { CompanyDetailPageSkeleton } from "@/components/dashboard/page-skeleton";

export const metadata = { title: "Company" };

// The client component reads the `[id]` segment via `useParams`, so the page
// stays a static shell (no `params` await) and streams the detail behind Suspense.
export default function CompanyDetailPage() {
  return (
    <Suspense fallback={<CompanyDetailPageSkeleton />}>
      <CompanyDetail />
    </Suspense>
  );
}
