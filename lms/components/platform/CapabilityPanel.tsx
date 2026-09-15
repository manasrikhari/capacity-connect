import { ColumnChart } from "@/components/charts/ColumnChart";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ShowMore } from "@/components/ui/ShowMore";
import type { CompetencyGap } from "@/lib/metrics";

const HEAD = "font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300 font-normal";

/** How many rows stand above the fold before the rest folds away. */
const VISIBLE_ROWS = 6;

/**
 * Training-needs analysis: which competencies the country is short of.
 *
 * Deliberately a table rather than a chart. This is the figure a ministry
 * circulates and acts on, so it wants exact counts per competency — and a wall
 * of large percentages reads as a scoreboard rather than a return. The columns
 * above it carry the shape; the table carries the detail. IMD's own SOP asks
 * for a "well defined Training need analysis system"; this is the smallest
 * honest version of it.
 */
export function CapabilityPanel({
  capability,
  gaps,
}: {
  capability: { category: string; coveragePercent: number }[];
  gaps: CompetencyGap[];
}) {
  if (gaps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Training needs</CardTitle>
        </CardHeader>
        <p className="text-sm text-ink-500">
          No course has declared the competencies it requires, so there is nothing to measure
          against. Set them under a course&apos;s Competency page.
        </p>
      </Card>
    );
  }

  const short = gaps.filter((g) => g.short > 0);
  const totalShort = short.reduce((n, g) => n + g.short, 0);
  const worstCategory = [...capability].sort((a, b) => a.coveragePercent - b.coveragePercent)[0];

  const head = gaps.slice(0, VISIBLE_ROWS);
  const rest = gaps.slice(VISIBLE_ROWS);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Training needs</CardTitle>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
          {short.length} of {gaps.length} competencies short
        </span>
      </CardHeader>

      <p className="mb-4 max-w-prose text-sm text-ink-500">
        Every competency a course requires, against the level its trainees currently hold.
        {worstCategory && (
          <>
            {" "}
            Weakest domain: <span className="text-ink-900">{worstCategory.category}</span>, at{" "}
            {worstCategory.coveragePercent}% coverage.
          </>
        )}
      </p>

      {/* Shortfall by domain — the shape of the problem, before the detail.
          Columns rather than labelled rows: a row of columns reads as a chart,
          a stack of labelled bars reads as a list. */}
      <ColumnChart
        className="mb-6"
        columns={capability.map((c) => ({
          label: c.category,
          value: 100 - c.coveragePercent,
        }))}
      />

      <GapTable rows={head} withHead />

      {/* The worst six stand above the fold; the tail is one click away rather
          than fifteen rows of scrolling on every visit. */}
      <ShowMore count={rest.length}>
        <GapTable rows={rest} />
      </ShowMore>

      <p className="mt-3 border-t border-hair pt-3 text-xs text-ink-300">
        {totalShort} trainee-competency pairs below the level their course requires. A trainee with
        no recorded level counts as below it.
      </p>
    </Card>
  );
}

/**
 * Rendered twice — visible rows and folded rows — so `table-fixed` plus a
 * shared colgroup is what keeps the two aligned as one continuous table.
 */
function GapTable({ rows, withHead = false }: { rows: CompetencyGap[]; withHead?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed text-left text-sm">
        <colgroup>
          <col className="w-[32%]" />
          <col className="w-[22%]" />
          <col className="w-[13%]" />
          <col className="w-[13%]" />
          <col className="w-[20%]" />
        </colgroup>
        {withHead && (
          <thead>
            <tr className={`border-b border-hair-strong ${HEAD}`}>
              <th className="py-2 pr-4">Competency</th>
              <th className="py-2 pr-4">Domain</th>
              <th className="py-2 pr-4 text-right">Required of</th>
              <th className="py-2 pr-4 text-right">Below level</th>
              <th className="py-2 text-right">Shortfall</th>
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-hair">
          {rows.map((g) => (
            <tr key={g.skill}>
              <td className="truncate py-2 pr-4 text-ink-900">{g.skill}</td>
              <td className="truncate py-2 pr-4 text-ink-500">{g.category}</td>
              <td className="py-2 pr-4 text-right font-mono tabular-nums text-ink-700">
                {g.expected}
              </td>
              <td className="py-2 pr-4 text-right font-mono tabular-nums text-ink-700">
                {g.short}
              </td>
              <td className="py-2 pl-4">
                <span className="flex items-center justify-end gap-2">
                  <span
                    aria-hidden="true"
                    className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-sunken sm:block"
                  >
                    <span
                      className="block h-full rounded-full bg-plum-500"
                      style={{ width: `${g.gapPercent}%` }}
                    />
                  </span>
                  <span
                    className={`w-10 text-right font-mono tabular-nums ${
                      g.gapPercent === 0 ? "text-ink-300" : "text-ink-900"
                    }`}
                  >
                    {g.gapPercent}%
                  </span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
