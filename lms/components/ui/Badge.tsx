import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeColor = "violet" | "green" | "amber" | "red" | "slate" | "blue";

const COLOR_CLASSES: Record<BadgeColor, string> = {
  violet: "bg-violet-100 text-violet-700",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  slate: "bg-slate-100 text-slate-600",
  blue: "bg-blue-100 text-blue-700",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
}

export function Badge({ className, color = "slate", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
        COLOR_CLASSES[color],
        className
      )}
      {...props}
    />
  );
}
