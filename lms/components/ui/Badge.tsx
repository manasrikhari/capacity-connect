import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeColor = "violet" | "green" | "amber" | "red" | "slate" | "blue";

/* Legacy key names kept for source compatibility; the values now map onto the
   OpenGrapes roles (violet→plum, green→sage, amber→partial, red→unpaid). */
const COLOR_CLASSES: Record<BadgeColor, string> = {
  violet: "bg-plum-100 text-plum-700",
  green: "bg-sage-100 text-sage-700",
  amber: "bg-status-partial/15 text-status-partial",
  red: "bg-status-unpaid/12 text-status-unpaid",
  slate: "bg-sunken text-ink-500",
  blue: "bg-paper border border-hair text-ink-500",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
}

export function Badge({ className, color = "slate", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-[6px] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]",
        COLOR_CLASSES[color],
        className
      )}
      {...props}
    />
  );
}
