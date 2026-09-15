import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GradeForm } from "@/components/assignments/GradeForm";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { coerceRubric, coerceScores, gradeSubmission, isLate } from "@/lib/rubric";
import { requireAdmin } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { ClipboardList } from "lucide-react";

export default async function GradeAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) redirect("/admin");

  const { id } = await params;
  const assignment = await prisma.assignment.findFirst({
    where: { id, batchId: batch.id },
    select: {
      id: true,
      title: true,
      brief: true,
      rubric: true,
      maxPoints: true,
      dueAt: true,
      isPublished: true,
      submissions: {
        orderBy: { submittedAt: "asc" },
        select: {
          id: true,
          body: true,
          scores: true,
          totalScore: true,
          feedback: true,
          submittedAt: true,
          gradedAt: true,
          trainee: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
  if (!assignment) notFound();

  const rubric = coerceRubric(assignment.rubric);

  return (
    <div className="space-y-6">
      <Link href="/admin/assignments" className="text-sm text-ink-500 hover:text-ink-900">
        ← Back to assignments
      </Link>

      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {assignment.isPublished ? (
            <Badge color="green">Published</Badge>
          ) : (
            <Badge color="amber">Draft</Badge>
          )}
          {assignment.dueAt && <Badge color="slate">Due {formatDate(assignment.dueAt)}</Badge>}
        </div>
        <h1 className="font-display text-2xl font-normal text-ink-900">{assignment.title}</h1>
        <p className="mt-2 whitespace-pre-line text-ink-700">{assignment.brief}</p>
      </div>

      {rubric.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rubric</CardTitle>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
              {assignment.maxPoints} points
            </span>
          </CardHeader>
          <ul className="divide-y divide-hair">
            {rubric.map((c) => (
              <li key={c.label} className="flex items-start justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm text-ink-900">{c.label}</p>
                  {c.guidance && <p className="text-xs text-ink-500">{c.guidance}</p>}
                </div>
                <span className="shrink-0 font-mono text-xs text-ink-300">{c.maxPoints}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {assignment.submissions.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No submissions yet"
          description={
            assignment.isPublished
              ? "Trainees can see this assignment — nobody has submitted."
              : "This is still a draft, so trainees cannot see it."
          }
        />
      ) : (
        <div className="space-y-4">
          {assignment.submissions.map((s) => {
            const scores = coerceScores(s.scores);
            const grade = gradeSubmission(rubric, scores, assignment.maxPoints);
            const late = isLate(s.submittedAt, assignment.dueAt);

            return (
              <Card key={s.id}>
                <CardHeader>
                  <CardTitle>{s.trainee.name ?? s.trainee.email}</CardTitle>
                  <div className="flex items-center gap-2">
                    {late && <Badge color="amber">Late</Badge>}
                    {s.gradedAt ? (
                      <Badge color="green">
                        {grade.total}/{grade.max}
                      </Badge>
                    ) : (
                      <Badge color="slate">Not graded</Badge>
                    )}
                  </div>
                </CardHeader>

                <p className="mb-4 whitespace-pre-line rounded-xl bg-sunken px-4 py-3 text-sm text-ink-700">
                  {s.body}
                </p>
                <p className="mb-4 font-mono text-[11px] text-ink-300">
                  Submitted {formatDate(s.submittedAt)}
                </p>

                <GradeForm
                  submissionId={s.id}
                  rubric={rubric}
                  maxPoints={assignment.maxPoints}
                  existing={scores}
                  feedback={s.feedback}
                />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
