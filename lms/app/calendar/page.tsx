import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { coursesStartingBetween } from "@/lib/catalogue-db";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Training calendar — Capacity Connect",
  description:
    "Upcoming capacity-building courses across IMD, NCMRWF, INCOIS and IITM, month by month.",
};

/** How many months ahead to publish. IMD publishes its calendar ~3 months out. */
const MONTHS_AHEAD = 6;

const MONTH_FMT = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" });

export default async function CalendarPage() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + MONTHS_AHEAD, 1);

  const courses = await coursesStartingBetween(from, to);

  // Group by calendar month, keeping the query's start-date ordering.
  const months = new Map<string, { label: string; courses: typeof courses }>();
  for (let i = 0; i < MONTHS_AHEAD; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.set(`${d.getFullYear()}-${d.getMonth()}`, { label: MONTH_FMT.format(d), courses: [] });
  }
  for (const c of courses) {
    if (!c.startDate) continue;
    const key = `${c.startDate.getFullYear()}-${c.startDate.getMonth()}`;
    months.get(key)?.courses.push(c);
  }

  const rows = [...months.values()];
  const totalListed = rows.reduce((n, m) => n + m.courses.length, 0);

  return (
    <>
      <PublicHeader
        right={
          <Link href="/courses" className="text-sm text-plum-700 hover:underline">
            All courses
          </Link>
        }
      />

      <main className="flex-1 bg-page">
        <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
          <div className="mb-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-300">
              Ministry of Earth Sciences · Capacity building
            </p>
            <h1 className="mt-2 font-display text-4xl font-normal text-ink-900">Training calendar</h1>
            <p className="mt-2 max-w-2xl text-ink-500">
              Courses starting over the next {MONTHS_AHEAD} months. Nominations from a parent office are
              normally sent before a course opens, so plan against these dates.
            </p>
          </div>

          {totalListed === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nothing scheduled yet"
              description="No courses have a start date in this window. Browse the full catalogue instead."
            />
          ) : (
            <div className="space-y-8">
              {rows.map((m) => (
                <section key={m.label}>
                  <h2 className="mb-3 border-b border-hair pb-2 font-display text-xl font-normal text-ink-900">
                    {m.label}
                    <span className="ml-2 font-mono text-[11px] tabular-nums text-ink-300">
                      {m.courses.length}
                    </span>
                  </h2>
                  {m.courses.length === 0 ? (
                    <p className="text-sm text-ink-300">No courses scheduled.</p>
                  ) : (
                    <ul className="divide-y divide-hair">
                      {m.courses.map((c) => (
                        <li key={c.id}>
                          <Link
                            href={`/courses/${c.slug ?? c.id}`}
                            className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3 transition-colors hover:bg-sunken"
                          >
                            <span className="w-24 shrink-0 font-mono text-xs tabular-nums text-ink-500">
                              {c.startDate ? formatDate(c.startDate) : "—"}
                            </span>
                            <span className="min-w-0 flex-1 text-sm font-medium text-ink-900">
                              {c.name}
                            </span>
                            {c.wmoTier && <Badge color="blue">{c.wmoTier}</Badge>}
                            {c.department && (
                              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                                {c.department}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
