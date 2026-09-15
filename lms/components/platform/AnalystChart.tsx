import { BarRows } from "@/components/charts/BarRows";
import { ColumnChart } from "@/components/charts/ColumnChart";
import type { AnalysisId } from "@/lib/analyst";
import type { CapacityMetrics } from "@/lib/metrics";

/**
 * Renders the analysis the assistant chose.
 *
 * Every figure here comes from `metrics` — the server's own computation — not
 * from the model's reply. The model chooses *which* view to show; it never
 * supplies the data behind it.
 */
export function AnalystChart({
  chart,
  metrics,
}: {
  chart: AnalysisId;
  metrics: CapacityMetrics;
}) {
  if (chart === "competency-gaps") {
    const rows = metrics.competencyGaps.slice(0, 6).map((g) => ({
      label: g.skill,
      value: g.gapPercent,
      max: 100,
      display: `${g.gapPercent}%`,
    }));
    return <Framed caption="Shortfall against the level each course requires" rows={rows} />;
  }

  if (chart === "capability-by-domain") {
    return (
      <Frame caption="Share of required competencies not yet held, by domain">
        <ColumnChart
          columns={metrics.capabilityByCategory.map((c) => ({
            label: c.category,
            value: 100 - c.coveragePercent,
          }))}
        />
      </Frame>
    );
  }

  if (chart === "certified-by-department") {
    const rows = metrics.byDepartment.map((d) => ({
      label: d.department,
      value: d.completionPercent ?? 0,
      max: 100,
      display: d.completionPercent == null ? "—" : `${d.completionPercent}%`,
    }));
    return <Framed caption="Share of each department's trainees who are certified" rows={rows} />;
  }

  if (chart === "trainees-by-domain") {
    const max = Math.max(1, ...metrics.byDomain.map((d) => d.trainees));
    const rows = metrics.byDomain.map((d) => ({
      label: d.domain,
      value: d.trainees,
      max,
      display: String(d.trainees),
    }));
    return <Framed caption="Trainees per domain, relative to the busiest" rows={rows} />;
  }

  // outcomes
  const rows = [
    { label: "Attendance", value: metrics.attendancePercent ?? 0, max: 100 },
    { label: "Certification rate", value: metrics.completionPercent ?? 0, max: 100 },
    { label: "Assessment pass rate", value: metrics.passRatePercent ?? 0, max: 100 },
  ].map((r) => ({ ...r, display: `${r.value}%` }));
  return <Framed caption="National outcome rates" rows={rows} />;
}

function Frame({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <figure className="mt-4 rounded-xl border border-hair bg-page p-4">
      {children}
      <figcaption className="mt-3 border-t border-hair pt-2 text-xs text-ink-300">
        {caption}
      </figcaption>
    </figure>
  );
}

function Framed({
  caption,
  rows,
}: {
  caption: string;
  rows: { label: string; value: number; max?: number; display?: string }[];
}) {
  if (rows.length === 0) {
    return (
      <p className="mt-4 rounded-xl border border-hair bg-page p-4 text-sm text-ink-500">
        No data recorded for this view yet.
      </p>
    );
  }
  return (
    <Frame caption={caption}>
      <BarRows rows={rows} />
    </Frame>
  );
}
