import { Suspense } from "react";

import { CompaniesDirectory } from "@/components/dashboard/companies-directory";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";

export const unstable_instant = {
  prefetch: "static",
  unstable_disableValidation: true,
};

export const metadata = { title: "Companies" };

export default function CompaniesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CompaniesDirectory />
    </Suspense>
  );
}
