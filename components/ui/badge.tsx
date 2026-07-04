import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

// The inset ring keeps soft badges legible on tinted rows/cards where the
// soft background alone would melt into the surface.
const TONES: Record<BadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground ring-border",
  success: "bg-success-soft text-success ring-success/25",
  warning: "bg-warning-soft text-warning ring-warning/25",
  danger: "bg-danger-soft text-danger ring-danger/25",
  info: "bg-info-soft text-info ring-info/25",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Leading status dot — a small identity cue that isn't color-alone text. */
  dot?: boolean;
}

export function Badge({
  className,
  tone = "neutral",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        TONES[tone],
        className,
      )}
      {...props}
    >
      {dot ? (
        <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      ) : null}
      {children}
    </span>
  );
}
