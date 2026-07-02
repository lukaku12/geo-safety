"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PeriodLink } from "@/components/layout/period-link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { OutcomeBadge } from "@/components/dashboard/status-badges";
import {
  useCompanyDetail,
  useCompanyReconciliation,
} from "@/hooks/use-dashboard-queries";
import { usePeriod } from "@/hooks/use-period";
import { isMonthPeriod } from "@/lib/utils/periods";
import {
  formatCurrency,
  formatDate,
  formatMonth,
  formatSignedCurrency,
} from "@/lib/utils/format";
import type { ContractStatus } from "@/lib/types/domain";

const CONTRACT_TONE: Record<ContractStatus, BadgeTone> = {
  active: "success",
  paused: "warning",
  ended: "neutral",
};

const CONTRACT_LABEL: Record<ContractStatus, string> = {
  active: "Active",
  paused: "Paused",
  ended: "Ended",
};

function BackLink() {
  return (
    <PeriodLink
      href="/companies"
      className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" /> Back to companies
    </PeriodLink>
  );
}

export function CompanyDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { period } = usePeriod();
  const detail = useCompanyDetail(id);
  const reconciliation = useCompanyReconciliation(
    {
      period,
      q: detail.data?.taxId,
      page: 1,
      pageSize: 1,
      sort: "name",
      order: "asc",
    },
    { enabled: Boolean(detail.data) },
  );
  const monthly = isMonthPeriod(period);

  const recon = useMemo(
    () =>
      reconciliation.data?.items.find((row) => row.companyId === id) ?? null,
    [reconciliation.data, id],
  );

  if (detail.isError) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
        <ErrorState
          title="Couldn't load company"
          description="It may not exist, or the service is unavailable."
          action={
            <button
              type="button"
              onClick={() => detail.refetch()}
              className="text-sm font-medium text-danger underline"
            >
              Retry
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <BackLink />

      <div className="flex flex-col gap-1">
        {detail.isPending ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <h2 className="text-2xl font-semibold tracking-tight">
            {detail.data.name}
          </h2>
        )}
        <p className="font-mono text-sm text-muted-foreground">
          {detail.isPending ? "" : `Tax ID ${detail.data.taxId}`}
        </p>
      </div>

      {/* This-month reconciliation summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Expected{monthly ? ` — ${formatMonth(period)}` : ""}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {monthly && recon ? formatCurrency(recon.expected) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {monthly && recon ? formatCurrency(recon.actual) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Difference</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <p className="text-2xl font-semibold tabular-nums">
              {monthly && recon ? formatSignedCurrency(recon.difference) : "—"}
            </p>
            {monthly && recon ? <OutcomeBadge outcome={recon.outcome} /> : null}
          </CardContent>
        </Card>
      </div>

      {/* Contracts */}
      <section className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold">Contracts</h3>
        {detail.isPending ? (
          <Card className="p-4">
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </Card>
        ) : detail.data.contracts.length === 0 ? (
          <EmptyState
            title="No contracts"
            description="This company has no contracts on record."
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Monthly amount
                    </th>
                    <th className="px-4 py-3 font-medium">Start</th>
                    <th className="px-4 py-3 font-medium">End</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.data.contracts.map((contract) => (
                    <tr
                      key={contract.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-3">
                        <Badge tone={CONTRACT_TONE[contract.status]}>
                          {CONTRACT_LABEL[contract.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatCurrency(contract.monthlyAmount)}
                      </td>
                      <td className="px-4 py-3">
                        {formatDate(contract.startDate)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {contract.endDate ? formatDate(contract.endDate) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
