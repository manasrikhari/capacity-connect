import { Radar } from "lucide-react";
import { BarRows } from "@/components/charts/BarRows";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CapacityMetrics } from "@/lib/metrics";

/**
 * Head count of distinct trainees per operational domain. Bars are scaled
 * against the busiest domain, so the top bar is always full — this is a
 * relative comparison, not a percentage. The caption says so.
 */
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
      <p className="mb-4 text-xs text-ink-500">
        Head count, relative to the largest domain. Full bar = the busiest domain, not 100%.
      </p>
      {rows.length === 0 ? (
        <EmptyState icon={Radar} title="No domain data yet" />
      ) : (
        <BarRows rows={rows} />
      )}
    </Card>
  );
}
