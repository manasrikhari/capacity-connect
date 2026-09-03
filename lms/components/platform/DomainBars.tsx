import { Radar } from "lucide-react";
import { BarRows } from "@/components/charts/BarRows";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CapacityMetrics } from "@/lib/metrics";

/** Distinct trainees per operational domain, scaled against the busiest domain. */
export function DomainBars({ byDomain }: { byDomain: CapacityMetrics["byDomain"] }) {
  const max = Math.max(1, ...byDomain.map((d) => d.trainees));
  const rows = byDomain.map((d) => ({
    label: d.domain,
    value: d.trainees,
    max,
    display: `${d.trainees}`,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trainees by domain</CardTitle>
      </CardHeader>
      {rows.length === 0 ? (
        <EmptyState icon={Radar} title="No domain data yet" />
      ) : (
        <BarRows rows={rows} />
      )}
    </Card>
  );
}
