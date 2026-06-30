"use client";

import { TransactionsPanel } from "@/components/dashboard/transactions-panel";
import { useDashboardParams } from "@/hooks/use-dashboard-params";

/** Client entry for the Transactions page — wires URL filter state to the panel. */
export function TransactionsView() {
  const { query, patch, toggleSort } = useDashboardParams();
  return <TransactionsPanel query={query} patch={patch} toggleSort={toggleSort} />;
}
