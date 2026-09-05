import { Building2 } from "lucide-react";
import { BarRows } from "@/components/charts/BarRows";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CapacityMetrics } from "@/lib/metrics";

/**
 * Share of each department's trainees who hold a certificate.
 * Rows are ordered by department size (see lib/metrics.ts), NOT by the
 * percentage drawn, so the bars are deliberately not monotonic.
 */
export function DepartmentBars({ byDepartment }: { byDepartment: CapacityMetrics["byDepartment"] }) {
  const rows = byDepartment.map((d) => ({
    label: d.department,
    value: d.completionPercent ?? 0,
    max: 100,
    display: d.completionPercent == null ? "—" : `${d.completionPercent}%`,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Certified by department</CardTitle>
      </CardHeader>
      <p className="mb-4 text-xs text-ink-500">
        Share of each department&rsquo;s trainees who are certified. Full bar = 100%. Largest
        department first.
      </p>
      {rows.length === 0 ? (
        <EmptyState icon={Building2} title="No department data yet" />
      ) : (
        <BarRows rows={rows} />
      )}
    </Card>
  );
}
