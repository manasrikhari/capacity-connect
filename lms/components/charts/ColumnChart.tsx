import { cn } from "@/lib/utils";

export type Column = {
  label: string;
  /** 0-100. */
  value: number;
  /** Optional second line under the label. */
  sub?: string;
};

/**
 * A compact vertical column chart. Dependency-free, plum fill, mono figures —
 * the same material as the rest of the design system.
 *
 * Vertical rather than the horizontal label→bar rows used elsewhere: a row of
 * columns reads as a chart at a glance, where a stack of labelled bars reads as
 * a list you have to work through.
 */
export function ColumnChart({
  columns,
  className,
  height = 96,
}: {
  columns: Column[];
  className?: string;
  height?: number;
}) {
  if (columns.length === 0) return null;

  return (
    <div className={cn("flex items-end gap-3", className)}>
      {columns.map((c) => {
        const pct = Math.max(0, Math.min(100, c.value));
        return (
          <div key={c.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <span className="font-mono text-[11px] tabular-nums text-ink-700">{pct}%</span>
            <div
              className="flex w-full items-end justify-center rounded-t-[3px] bg-sunken"
              style={{ height }}
            >
              <div
                className="w-full rounded-t-[3px] bg-plum-500"
                style={{ height: `${pct}%` }}
                role="img"
                aria-label={`${c.label}: ${pct}%`}
              />
            </div>
            <span className="w-full text-center text-[11px] leading-tight text-ink-700">
              {c.label}
            </span>
            {c.sub && (
              <span className="-mt-1 w-full text-center font-mono text-[10px] text-ink-300">
                {c.sub}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
