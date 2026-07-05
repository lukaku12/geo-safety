import { ArrowLeft } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

/**
 * Page-level Suspense fallbacks plus the shared loading building blocks.
 *
 * Every skeleton mirrors the exact layout classes of the page it stands in
 * for (same flex chains, gaps, and heights), and static chrome — headings,
 * card titles — renders as real text. The goal: when the data arrives,
 * content fades in without anything moving.
 */

/** One fake row set, cycled for an organic look instead of uniform bars. */
const ROW_WIDTHS = ["w-40", "w-56", "w-32", "w-48", "w-36"];

/**
 * Mimics a data table: a header strip and rows, clipped by its container so
 * it fills whatever height the table card has. `rows` only matters in
 * flowing contexts (e.g. the contracts card); in full-height cards pass
 * enough rows to overfill and let the clip do the work.
 */
export function TableSkeleton({ rows = 16 }: { rows?: number }) {
  return (
    <div aria-hidden className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-6 border-b border-border px-4 py-3.5">
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="hidden h-3.5 w-40 sm:block" />
        <Skeleton className="ml-auto h-3.5 w-20" />
        <Skeleton className="h-3.5 w-16" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex shrink-0 items-center gap-6 border-b border-border px-4 py-3 last:border-0"
        >
          <Skeleton className="h-4 w-16" />
          <div className="flex w-28 flex-col gap-1.5 sm:w-40">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton
            className={cn("hidden h-4 sm:block", ROW_WIDTHS[i % ROW_WIDTHS.length])}
          />
          <Skeleton className="ml-auto h-4 w-20" />
          <Skeleton
            className={cn("h-5 rounded-full", i % 2 === 0 ? "w-20" : "w-24")}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Placeholder for a `role="tablist"` pill group (status/outcome filters).
 * The real group is `inline-flex self-start` — sized to its own content, not
 * a full-width bar — so a plain wide `<Skeleton>` bar in its place visibly
 * collapses to the narrower real tabs the instant they render, reading as a
 * second, separate loading step instead of one continuous fade. Matching the
 * container's shape here removes that jump.
 */
function TabPillsSkeleton({ widths }: { widths: string[] }) {
  return (
    <div
      aria-hidden
      className="inline-flex items-center gap-0.5 self-start rounded-md border border-border bg-surface p-0.5"
    >
      {widths.map((w, i) => (
        <Skeleton key={i} className={cn("h-7", w)} />
      ))}
    </div>
  );
}

/** Placeholder with the same footprint as <PaginationBar>. */
export function PaginationBarSkeleton() {
  return (
    <div
      aria-hidden
      className="flex shrink-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
    >
      <Skeleton className="h-5 w-44" />
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}

/** The stats row of the overview; also used by <StatsCards> while pending. */
export function StatsGridSkeleton() {
  return (
    <div
      aria-hidden
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex-row items-center justify-between">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-8 w-8" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-20" />
            <Skeleton className="mt-1.5 h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** A table card that fills the remaining height, as on all table pages. */
function TableCardSkeleton() {
  return (
    <Card className="flex min-h-40 flex-1 flex-col overflow-hidden">
      <TableSkeleton />
    </Card>
  );
}

export function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <StatsGridSkeleton />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Match breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-60 w-full" />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Expected vs. actual</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function TransactionsPageSkeleton() {
  return (
    <section className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TabPillsSkeleton widths={["w-10", "w-16", "w-20", "w-16"]} />
        <Skeleton className="h-10 w-full sm:w-80" />
      </div>

      <TableCardSkeleton />
      <PaginationBarSkeleton />
    </section>
  );
}

export function CompaniesPageSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 sm:justify-end">
        <Skeleton className="h-10 w-full sm:w-80" />
      </div>
      <TableCardSkeleton />
      <PaginationBarSkeleton />
    </div>
  );
}

export function ReconciliationPageSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <section className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex shrink-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TabPillsSkeleton
            widths={["w-10", "w-20", "w-16", "w-16", "w-24", "w-24"]}
          />
          <Skeleton className="h-10 w-full sm:w-80" />
        </div>

        <TableCardSkeleton />
        <PaginationBarSkeleton />
      </section>
    </div>
  );
}

export function CompanyDetailPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Inert stand-in for the back link (the real one reads search params). */}
      <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to companies
      </span>

      <div className="flex flex-col gap-1">
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-5 w-36" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {["Expected", "Actual", "Difference"].map((title) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold">Contracts</h3>
        <Card className="overflow-hidden">
          <TableSkeleton rows={3} />
        </Card>
      </section>
    </div>
  );
}
