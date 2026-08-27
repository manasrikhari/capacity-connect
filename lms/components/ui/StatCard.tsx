import type { LucideIcon } from "lucide-react";
import type { BadgeColor } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const COLOR_CLASSES: Record<BadgeColor, string> = {
  violet: "bg-violet-100 text-violet-600",
  green: "bg-emerald-100 text-emerald-600",
  amber: "bg-amber-100 text-amber-600",
  red: "bg-red-100 text-red-600",
  slate: "bg-slate-100 text-slate-600",
  blue: "bg-blue-100 text-blue-600",
};

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  color = "violet",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  color?: BadgeColor;
}) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", COLOR_CLASSES[color])}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-2xl font-semibold text-slate-800">{value}</p>
          <p className="truncate text-sm text-slate-500">{label}</p>
        </div>
      </div>
      {hint && <p className="mt-3 wrap-break-word text-xs text-slate-400">{hint}</p>}
    </Card>
  );
}
