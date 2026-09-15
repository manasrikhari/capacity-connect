import { Building2, MessageSquare, Star, UserRound, Wrench } from "lucide-react";
import { BarRows } from "@/components/charts/BarRows";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";

export type FeedbackAverages = {
  overall: number | null;
  content: number | null;
  trainer: number | null;
  infrastructure: number | null;
};

export type AnonymousEntry = {
  designation: string;
  comments: string | null;
  suggestions: string | null;
};

function avgLabel(value: number | null): string {
  return value == null ? "—" : value.toFixed(1);
}

export function FeedbackSummary({
  count,
  averages,
  distribution,
  entries,
}: {
  count: number;
  averages: FeedbackAverages;
  /** Counts of the overall rating for each star level, index 0 → 1★ … 4 → 5★. */
  distribution: number[];
  entries: AnonymousEntry[];
}) {
  if (count === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No feedback yet"
        description="Trainee feedback for this course will appear here once submitted."
      />
    );
  }

  const rows = [5, 4, 3, 2, 1].map((star) => ({
    label: `${star} star${star === 1 ? "" : "s"}`,
    value: distribution[star - 1] ?? 0,
    max: count,
    display: String(distribution[star - 1] ?? 0),
  }));

  const withText = entries.filter((e) => e.comments || e.suggestions);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Averages</CardTitle>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
            {count} response{count === 1 ? "" : "s"}
          </span>
        </CardHeader>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={Star} label="Overall" value={avgLabel(averages.overall)} />
          <StatCard icon={MessageSquare} label="Content" value={avgLabel(averages.content)} />
          <StatCard icon={UserRound} label="Trainer" value={avgLabel(averages.trainer)} />
          <StatCard icon={Wrench} label="Infrastructure" value={avgLabel(averages.infrastructure)} />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overall rating distribution</CardTitle>
        </CardHeader>
        <BarRows rows={rows} />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comments</CardTitle>
          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
            <Building2 className="size-3" />
            Anonymised
          </span>
        </CardHeader>
        {withText.length === 0 ? (
          <p className="text-sm text-ink-500">No written comments yet.</p>
        ) : (
          <ul className="space-y-4">
            {withText.map((e, i) => (
              <li key={i} className="border-t border-hair pt-4 first:border-0 first:pt-0">
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                  {e.designation || "Trainee"}
                </p>
                {e.comments && <p className="text-sm text-ink-700">{e.comments}</p>}
                {e.suggestions && (
                  <p className="mt-1.5 text-sm text-ink-500">
                    <span className="text-ink-300">Suggests: </span>
                    {e.suggestions}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
