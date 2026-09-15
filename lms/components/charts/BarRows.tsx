import { cn } from "@/lib/utils";

export type BarRow = {
  label: string;
  /** Numerator shown as the mono value (e.g. a percent or a level). */
  value: number;
  /** Denominator the fill is scaled against (defaults to 100). */
  max?: number;
  /** Optional explicit display string for the value (else the number). */
  display?: string;
};

/**
 * A stack of hairline label → sunken track → plum fill rows. Design-system
 * native: no charting library, plum owns the fill, mono owns the figure.
 */
export function BarRows({
  rows,
  className,
  valueSuffix = "",
}: {
  rows: BarRow[];
  className?: string;
  valueSuffix?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {rows.map((r) => {
        const max = r.max ?? 100;
        const pct = max > 0 ? Math.max(0, Math.min(100, (r.value / max) * 100)) : 0;
        return (
          <div key={r.label} className="min-w-0">
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="truncate text-sm text-ink-700">{r.label}</span>
              <span className="shrink-0 font-mono text-xs tabular-nums text-ink-500">
                {r.display ?? r.value}
                {valueSuffix}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-sunken">
              <div
                className="h-full rounded-full bg-plum-600"
                style={{ width: `${pct}%` }}
                aria-hidden="true"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
