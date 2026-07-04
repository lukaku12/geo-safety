import { Suspense } from "react";

import { ReconciliationView } from "@/components/dashboard/reconciliation-view";
import { ReconciliationPageSkeleton } from "@/components/dashboard/page-skeleton";

export const unstable_instant = {
  prefetch: "static",
  unstable_disableValidation: true,
};

export const metadata = { title: "Reconciliation" };

export default function ReconciliationPage() {
  return (
    <Suspense fallback={<ReconciliationPageSkeleton />}>
      <ReconciliationView />
    </Suspense>
  );
}
