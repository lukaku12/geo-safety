import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Inbox } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface px-6 py-14 text-center",
        className,
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-muted text-muted-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description ? (
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
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
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-danger/30 bg-danger-soft px-6 py-14 text-center",
        className,
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-danger/10 text-danger">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-danger">{title}</p>
        {description ? (
          <p className="max-w-md text-sm text-danger/80">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
