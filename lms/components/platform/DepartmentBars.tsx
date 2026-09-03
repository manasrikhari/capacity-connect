import { Building2 } from "lucide-react";
import { BarRows } from "@/components/charts/BarRows";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CapacityMetrics } from "@/lib/metrics";

/** Certification-completion % per department, tallest first. */
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
        <CardTitle>Completion by department</CardTitle>
      </CardHeader>
      {rows.length === 0 ? (
        <EmptyState icon={Building2} title="No department data yet" />
      ) : (
        <BarRows rows={rows} />
      )}
    </Card>
  );
}
