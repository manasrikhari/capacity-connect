import { Building2 } from "lucide-react";
import { BarRows } from "@/components/charts/BarRows";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ShowMore } from "@/components/ui/ShowMore";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CapacityMetrics } from "@/lib/metrics";

/**
 * Share of each department's trainees who hold a certificate.
 * Rows are ordered by department size (see lib/metrics.ts), NOT by the
 * percentage drawn, so the bars are deliberately not monotonic.
 */
/** Rows above the fold before the rest folds away. */
const VISIBLE_ROWS = 3;

export function DepartmentBars({ byDepartment }: { byDepartment: CapacityMetrics["byDepartment"] }) {
  const rows = byDepartment.map((d) => ({
    label: d.department,
    value: d.completionPercent ?? 0,
    max: 100,
    display: d.completionPercent == null ? "—" : `${d.completionPercent}%`,
  }));

  // Supporting detail, not the headline — folded away by default so the
  // training-needs table above it is what a reader lands on.
  return (
    <Card>
      <CardHeader>
        <CardTitle>Certified by department</CardTitle>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
          {byDepartment.length} departments
        </span>
      </CardHeader>
      <p className="mb-4 text-xs text-ink-500">
        Share of each department&rsquo;s trainees who are certified. Full bar = 100%. Largest
        department first.
      </p>
      {rows.length === 0 ? (
        <EmptyState icon={Building2} title="No department data yet" />
      ) : (
        <>
          <BarRows rows={rows.slice(0, VISIBLE_ROWS)} />
          <ShowMore count={rows.length - VISIBLE_ROWS} className="mt-3">
            <BarRows rows={rows.slice(VISIBLE_ROWS)} className="pt-3" />
          </ShowMore>
        </>
      )}
    </Card>
  );
}
