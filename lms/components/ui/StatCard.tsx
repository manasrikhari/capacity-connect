import type { LucideIcon } from "lucide-react";
import type { BadgeColor } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

/* Figure color: ink by default; terracotta for a due amount, sage for a
   positive one. Other legacy keys all resolve to ink. */
const VALUE_CLASSES: Partial<Record<BadgeColor, string>> = {
  red: "text-status-unpaid",
  green: "text-sage-700",
};

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  color = "violet",
}: {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  color?: BadgeColor;
}) {
  return (
    <div className="min-w-0 border-t border-hair-strong pt-3">
      <p
        className={cn(
          "truncate font-display text-3xl font-normal tabular-nums",
          VALUE_CLASSES[color] ?? "text-ink-900"
        )}
      >
        {value}
      </p>
      <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-ink-500">
        {Icon && <Icon aria-hidden="true" className="size-3.5 shrink-0 text-ink-300" />}
        <span className="truncate">{label}</span>
      </p>
      {hint && <p className="mt-1 wrap-break-word text-[11.5px] text-ink-300">{hint}</p>}
    </div>
  );
}
