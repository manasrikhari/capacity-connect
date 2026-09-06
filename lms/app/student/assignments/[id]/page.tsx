import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SubmitAssignmentForm } from "@/components/assignments/SubmitAssignmentForm";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";
import { coerceRubric, coerceScores, gradeSubmission, isLate } from "@/lib/rubric";
import { getSession } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export default async function StudentAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const { id } = await params;
  const assignment = await prisma.assignment.findFirst({
    where: { id, isPublished: true },
    select: {
      id: true,
      batchId: true,
      title: true,
      brief: true,
      rubric: true,
      maxPoints: true,
      dueAt: true,
      submissions: {
        where: { traineeId: session.user.id },
        select: {
          body: true,
          submittedAt: true,
          gradedAt: true,
          scores: true,
          feedback: true,
        },
      },
    },
  });
  if (!assignment) notFound();

  // The assignment id alone must not grant access — check enrolment.
  const enrolment = await prisma.enrollment.findUnique({
    where: { studentId_batchId: { studentId: session.user.id, batchId: assignment.batchId } },
    select: { status: true },
  });
  if (enrolment?.status !== "APPROVED") notFound();

  const rubric = coerceRubric(assignment.rubric);
  const mine = assignment.submissions[0] ?? null;
  const grade = mine?.gradedAt
    ? gradeSubmission(rubric, coerceScores(mine.scores), assignment.maxPoints)
    : null;
  const scores = mine ? coerceScores(mine.scores) : [];
  const late = mine ? isLate(mine.submittedAt, assignment.dueAt) : false;

  return (
    <div className="space-y-6">
      <Link href="/student/assignments" className="text-sm text-ink-500 hover:text-ink-900">
        ← Back to assignments
      </Link>

      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {assignment.dueAt && <Badge color="slate">Due {formatDate(assignment.dueAt)}</Badge>}
          {late && <Badge color="amber">Submitted late</Badge>}
        </div>
        <h1 className="font-display text-2xl font-normal text-ink-900">{assignment.title}</h1>
        <p className="mt-2 whitespace-pre-line text-ink-700">{assignment.brief}</p>
      </div>

      {rubric.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>How this is marked</CardTitle>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
              {assignment.maxPoints} points
            </span>
          </CardHeader>
          <ul className="divide-y divide-hair">
            {rubric.map((c) => {
              const got = scores.find((s) => s.label === c.label);
              return (
                <li key={c.label} className="flex items-start justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm text-ink-900">{c.label}</p>
                    {c.guidance && <p className="text-xs text-ink-500">{c.guidance}</p>}
                  </div>
                  <span className="shrink-0 font-mono text-xs text-ink-300">
                    {grade && got ? `${got.points} / ${c.maxPoints}` : c.maxPoints}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {grade && (
        <Card className="border-sage-300 bg-sage-50">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-sage-700">Result</p>
          <p className="mt-1 font-display text-3xl font-normal tabular-nums text-ink-900">
            {grade.total}
            <span className="text-lg text-ink-500"> / {grade.max}</span>
          </p>
          {mine?.feedback && (
            <p className="mt-3 whitespace-pre-line text-sm text-ink-700">{mine.feedback}</p>
          )}
        </Card>
      )}

      <SubmitAssignmentForm
        assignmentId={assignment.id}
        existingBody={mine?.body ?? ""}
        isGraded={Boolean(mine?.gradedAt)}
        submittedAt={mine?.submittedAt ?? null}
      />
    </div>
  );
}
