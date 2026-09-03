import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import type { CapacityMetrics as CapacityMetricsType } from "@/lib/metrics";
import { cn } from "@/lib/utils";

function fmtPct(v: number | null) {
  return v == null ? "—" : `${v}%`;
}

/**
 * National-capacity overview: the four headline rates with the denominators
 * behind them, so the StatCard figures on the dashboard have their context.
 */
export function CapacityMetrics({ metrics }: { metrics: CapacityMetricsType }) {
  const { totals } = metrics;
  const items: { label: string; value: string; hint: string; good?: boolean | null }[] = [
    {
      label: "Attendance",
      value: fmtPct(metrics.attendancePercent),
      hint: `${totals.attendanceMarks} marks recorded`,
    },
    {
      label: "Completion",
      value: fmtPct(metrics.completionPercent),
      hint: `${metrics.certifiedCount} certified / ${totals.enrollments} enrolments`,
    },
    {
      label: "Assessment pass rate",
      value: fmtPct(metrics.passRatePercent),
      hint: `${totals.attempts} attempts`,
      good: metrics.passRatePercent == null ? null : metrics.passRatePercent >= 60,
    },
    {
      label: "Certified personnel",
      value: `${metrics.certifiedCount}`,
      hint: "valid certificates",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>National capacity</CardTitle>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">Live</span>
      </CardHeader>
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="min-w-0 border-t border-hair-strong pt-3">
            <p
              className={cn(
                "truncate font-display text-3xl font-normal tabular-nums",
                it.good === true && "text-sage-700",
                it.good === false && "text-status-unpaid",
                (it.good === undefined || it.good === null) && "text-ink-900",
              )}
            >
              {it.value}
            </p>
            <p className="mt-1.5 truncate text-[12.5px] font-medium text-ink-500">{it.label}</p>
            <p className="mt-1 wrap-break-word text-[11.5px] text-ink-300">{it.hint}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
