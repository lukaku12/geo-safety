"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  MoreHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";

export function SortHeader<TField extends string>({
  label,
  field,
  active,
  order,
  onToggle,
  align = "left",
}: {
  label: string;
  field: TField;
  active: boolean;
  order: "asc" | "desc";
  onToggle: (field: TField) => void;
  align?: "left" | "right";
}) {
  const Icon = !active ? ChevronsUpDown : order === "asc" ? ArrowUp : ArrowDown;

  return (
    <th
      className={cn(
        "px-4 py-3 font-medium",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(field)}
        className={cn(
          "inline-flex items-center gap-1 hover:text-foreground",
          align === "right" && "flex-row-reverse",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        <Icon className="h-3.5 w-3.5" />
      </button>
    </th>
  );
}

type PaginationItem =
  | { type: "page"; page: number }
  | { type: "jump-prev"; page: number }
  | { type: "jump-next"; page: number };

function getPaginationItems(page: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 9) {
    return Array.from({ length: totalPages }, (_, i) => ({
      type: "page",
      page: i + 1,
    }));
  }

  const siblings = 2;
  const left = Math.max(2, page - siblings);
  const right = Math.min(totalPages - 1, page + siblings);
  const items: PaginationItem[] = [{ type: "page", page: 1 }];

  if (left > 2) {
    items.push({ type: "jump-prev", page: Math.max(1, page - 5) });
  } else {
    for (let p = 2; p < left; p += 1) items.push({ type: "page", page: p });
  }

  for (let p = left; p <= right; p += 1) {
    items.push({ type: "page", page: p });
  }

  if (right < totalPages - 1) {
    items.push({ type: "jump-next", page: Math.min(totalPages, page + 5) });
  } else {
    for (let p = right + 1; p < totalPages; p += 1) {
      items.push({ type: "page", page: p });
    }
  }

  items.push({ type: "page", page: totalPages });
  return items;
}

export function PaginationBar({
  page,
  pageSize,
  total,
  totalPages,
  itemLabel,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(total, safePage * pageSize);
  const items = useMemo(
    () => getPaginationItems(safePage, totalPages),
    [safePage, totalPages],
  );
  const [lastExternalPage, setLastExternalPage] = useState(safePage);
  const [jumpValue, setJumpValue] = useState(String(safePage));

  if (safePage !== lastExternalPage) {
    setLastExternalPage(safePage);
    setJumpValue(String(safePage));
  }

  const goToPage = (nextPage: number) => {
    const clamped = Math.min(Math.max(nextPage, 1), totalPages);
    if (clamped !== safePage) onPageChange(clamped);
  };

  const submitJump = () => {
    const nextPage = Number(jumpValue);
    if (Number.isFinite(nextPage)) goToPage(nextPage);
    else setJumpValue(String(safePage));
  };

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-sm text-muted-foreground">
        {from}-{to} of {total} {itemLabel}
        {total === 1 ? "" : "s"}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label="Rows per page"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-8 w-28"
        >
          {[10, 25, 50, 100].map((value) => (
            <option key={value} value={value}>
              {value} / page
            </option>
          ))}
        </Select>

        <Button
          variant="secondary"
          size="icon"
          aria-label="Previous page"
          title="Previous page"
          disabled={safePage <= 1}
          onClick={() => goToPage(safePage - 1)}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          {items.map((item) =>
            item.type === "page" ? (
              <button
                key={`page-${item.page}`}
                type="button"
                aria-label={`Page ${item.page}`}
                aria-current={item.page === safePage ? "page" : undefined}
                onClick={() => goToPage(item.page)}
                className={cn(
                  "h-8 min-w-8 rounded-md border px-2 text-sm font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  item.page === safePage
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-muted-foreground hover:bg-surface-muted hover:text-foreground",
                )}
              >
                {item.page}
              </button>
            ) : (
              <button
                key={`${item.type}-${item.page}`}
                type="button"
                aria-label={
                  item.type === "jump-prev"
                    ? "Jump back 5 pages"
                    : "Jump forward 5 pages"
                }
                title={
                  item.type === "jump-prev"
                    ? "Jump back 5 pages"
                    : "Jump forward 5 pages"
                }
                onClick={() => goToPage(item.page)}
                className="group flex h-8 min-w-8 items-center justify-center rounded-md border border-border bg-surface px-2 text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <MoreHorizontal className="h-4 w-4 group-hover:hidden" />
                {item.type === "jump-prev" ? (
                  <ChevronsLeft className="hidden h-4 w-4 group-hover:block" />
                ) : (
                  <ChevronsRight className="hidden h-4 w-4 group-hover:block" />
                )}
              </button>
            ),
          )}
        </div>

        <Button
          variant="secondary"
          size="icon"
          aria-label="Next page"
          title="Next page"
          disabled={safePage >= totalPages}
          onClick={() => goToPage(safePage + 1)}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <form
          className="flex items-center gap-1 text-sm text-muted-foreground"
          onSubmit={(e) => {
            e.preventDefault();
            submitJump();
          }}
        >
          <span>Go to</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            onBlur={submitJump}
            aria-label="Go to page"
            className="h-8 w-14 rounded-md border border-input bg-surface px-2 text-center text-sm tabular-nums text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </form>
      </div>
    </div>
  );
}
