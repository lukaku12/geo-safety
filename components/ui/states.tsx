import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export function EmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-danger/30 bg-danger-soft px-6 py-12 text-center",
        className,
      )}
    >
      <p className="text-sm font-medium text-danger">{title}</p>
      {description ? (
        <p className="max-w-md text-sm text-danger/80">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
