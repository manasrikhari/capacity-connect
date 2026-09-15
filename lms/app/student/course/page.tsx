import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getActiveStudentBatch } from "@/lib/batch";
import { getCourseWeeks } from "@/lib/course-week-db";
import { prisma } from "@/lib/prisma";
import { coerceRubric, coerceScores, gradeSubmission } from "@/lib/rubric";
import { getSession } from "@/lib/session";

/**
 * The player's landing pane — the course home.
 *
 * It carries what the removed Notes/Tests/Assignments/Library indexes used to:
 * where to pick up, how far each week has got, and every mark awarded so far.
 * Without that, trimming those four nav entries would have lost information
 * rather than just tidying the navigation.
 */
export default async function CourseOverviewPage() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const batch = await getActiveStudentBatch(session);
  if (!batch) redirect("/student");

  const [weeks, submissions, attempts] = await Promise.all([
    getCourseWeeks(batch.id, session.user.id),
    prisma.assignmentSubmission.findMany({
      where: { traineeId: session.user.id, assignment: { batchId: batch.id } },
      orderBy: { submittedAt: "desc" },
      select: {
        scores: true,
        gradedAt: true,
        assignment: { select: { id: true, title: true, rubric: true, maxPoints: true } },
      },
    }),
    prisma.testAttempt.findMany({
      where: { studentId: session.user.id, batchId: batch.id },
      orderBy: { submittedAt: "desc" },
      select: { score: true, totalMarks: true, test: { select: { id: true, title: true } } },
    }),
  ]);

  const populated = weeks.filter((w) => !w.progress.isEmpty);
  const totalItems = weeks.reduce((n, w) => n + w.items.length, 0);

  // The single most useful thing on this pane: what to do next.
  const next = weeks.flatMap((w) => w.items).find((i) => !i.done) ?? null;

  const results = [
    ...attempts.map((a) => ({
      id: a.test.id,
      title: a.test.title,
      href: `/student/course/test/${a.test.id}`,
      score: a.score,
      max: a.totalMarks,
      pending: false,
    })),
    ...submissions.map((s) => {
      const g = gradeSubmission(
        coerceRubric(s.assignment.rubric),
        coerceScores(s.scores),
        s.assignment.maxPoints,
      );
      return {
        id: s.assignment.id,
        title: s.assignment.title,
        href: `/student/course/assignment/${s.assignment.id}`,
        score: g.total,
        max: g.max,
        pending: !s.gradedAt,
      };
    }),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {batch.subject && <Badge color="violet">{batch.subject}</Badge>}
          {batch.grade && <Badge color="slate">{batch.grade}</Badge>}
        </div>
        <h1 className="font-display text-3xl font-normal leading-tight text-ink-900">
          {batch.name}
        </h1>
        <p className="mt-2 text-ink-500">
          {populated.length} week{populated.length === 1 ? "" : "s"}, {totalItems} item
          {totalItems === 1 ? "" : "s"}. Nothing is locked — work through it in any order.
        </p>
      </header>

      {next && (
        <Link
          href={next.href}
          className="flex items-center gap-4 rounded-2xl border border-plum-200 bg-plum-50 px-5 py-4 transition-colors hover:border-plum-300"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-plum-600">
              Pick up here
            </span>
            <span className="mt-0.5 block truncate text-base font-medium text-ink-900">
              {next.title}
            </span>
            {next.meta && (
              <span className="block truncate text-xs text-ink-500">{next.meta}</span>
            )}
          </span>
          <ArrowRight className="size-5 shrink-0 text-plum-600" />
        </Link>
      )}

      {totalItems === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nothing published yet"
          description="Your trainer has not added any material to this course."
        />
      ) : (
        <section>
          <h2 className="mb-3 font-display text-lg font-normal text-ink-900">Weeks</h2>
          <ul className="space-y-2">
            {populated.map((w) => {
              const done = w.items.filter((i) => i.done).length;
              return (
                <li key={w.id ?? "unsorted"}>
                  <Card className="flex flex-wrap items-center gap-4">
                    <span className="w-10 shrink-0 font-mono text-xs text-ink-300">
                      {w.index > 0 ? `W${w.index}` : "—"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink-900">{w.title}</span>
                      {w.summary && (
                        <span className="block truncate text-xs text-ink-500">{w.summary}</span>
                      )}
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-mono text-sm tabular-nums text-ink-900">
                        {done}/{w.items.length}
                      </span>
                      <span className="block font-mono text-[10px] text-ink-300">
                        {w.progress.percent}%
                      </span>
                    </span>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {results.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg font-normal text-ink-900">Your marks</h2>
          <Card>
            <ul className="divide-y divide-hair">
              {results.map((r) => (
                <li key={`${r.href}`}>
                  <Link
                    href={r.href}
                    className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:bg-sunken"
                  >
                    <span className="min-w-0 truncate text-sm text-ink-900">{r.title}</span>
                    {r.pending ? (
                      <Badge color="slate">Awaiting grade</Badge>
                    ) : (
                      <span className="shrink-0 font-mono text-sm tabular-nums text-ink-900">
                        {r.score}
                        <span className="text-ink-300"> / {r.max}</span>
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </div>
  );
}
