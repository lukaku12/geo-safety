import { Suspense } from "react";

import { TransactionsView } from "@/components/dashboard/transactions-view";
import { TransactionsPageSkeleton } from "@/components/dashboard/page-skeleton";

export const unstable_instant = {
  prefetch: "static",
  unstable_disableValidation: true,
};

export const metadata = { title: "Transactions" };

export default function TransactionsPage() {
  return (
    <Suspense fallback={<TransactionsPageSkeleton />}>
      <TransactionsView />
    </Suspense>
  );
}
