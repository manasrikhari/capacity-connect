import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AssignmentComposer } from "@/components/assignments/AssignmentComposer";
import { PublishAssignmentButton } from "@/components/assignments/PublishAssignmentButton";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export default async function AdminAssignmentsPage() {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) redirect("/admin");

  const [assignments, weeks, skills] = await Promise.all([
    prisma.assignment.findMany({
      where: { batchId: batch.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        dueAt: true,
        maxPoints: true,
        isPublished: true,
        week: { select: { index: true } },
        _count: { select: { submissions: true } },
        submissions: { where: { gradedAt: null }, select: { id: true } },
      },
    }),
    prisma.courseWeek.findMany({
      where: { batchId: batch.id },
      orderBy: { index: "asc" },
      select: { id: true, index: true, title: true },
    }),
    prisma.skill.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-ink-900">Assignments</h1>
        <p className="mt-1 text-sm text-ink-500">
          Practical work graded against a rubric — the non-MCQ half of IMD&apos;s internal
          assessment.
        </p>
      </div>

      <AssignmentComposer weeks={weeks} skills={skills} />

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <ClipboardList className="size-5 text-ink-300" />
              All assignments
            </span>
          </CardTitle>
        </CardHeader>

        {assignments.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No assignments yet"
            description="Set one above — trainees see it as soon as you publish."
          />
        ) : (
          <ul className="divide-y divide-hair">
            {assignments.map((a) => {
              const ungraded = a.submissions.length;
              return (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/assignments/${a.id}`}
                        className="text-sm font-medium text-ink-900 hover:underline"
                      >
                        {a.title}
                      </Link>
                      {a.week && <Badge color="slate">Week {a.week.index}</Badge>}
                      {a.isPublished ? (
                        <Badge color="green">Published</Badge>
                      ) : (
                        <Badge color="amber">Draft</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {a.maxPoints} points
                      {a.dueAt ? ` · due ${formatDate(a.dueAt)}` : ""} · {a._count.submissions}{" "}
                      submission{a._count.submissions === 1 ? "" : "s"}
                      {ungraded > 0 ? ` · ${ungraded} to grade` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <PublishAssignmentButton id={a.id} isPublished={a.isPublished} />
                    <Link
                      href={`/admin/assignments/${a.id}`}
                      className="rounded-lg border border-hair px-3 py-1.5 text-xs text-ink-500 transition-colors hover:border-plum-300 hover:text-ink-900"
                    >
                      {ungraded > 0 ? `Grade (${ungraded})` : "View"}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
