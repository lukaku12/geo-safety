import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export type CardTone = "default" | "warning" | "danger";

/**
 * Routine cards sit at the base elevation; toned cards (a problem the operator
 * should act on) get a soft tint plus the raised shadow so they outrank their
 * neighbors instead of relying on a badge alone.
 */
const TONES: Record<CardTone, string> = {
  default: "border-border bg-card shadow-card",
  warning: "border-warning/25 bg-warning-soft/50 shadow-raised",
  danger: "border-danger/25 bg-danger-soft/50 shadow-raised",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
}

export function Card({ className, tone = "default", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border text-card-foreground",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1 p-5 pb-3", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}
