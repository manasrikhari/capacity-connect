import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getActiveStudentBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { coerceRubric, coerceScores, gradeSubmission, isLate } from "@/lib/rubric";
import { getSession } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export default async function StudentAssignmentsPage() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const batch = await getActiveStudentBatch(session);
  if (!batch) redirect("/student");

  const assignments = await prisma.assignment.findMany({
    where: { batchId: batch.id, isPublished: true },
    orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      dueAt: true,
      maxPoints: true,
      rubric: true,
      week: { select: { index: true } },
      submissions: {
        where: { traineeId: session.user.id },
        select: {
          submittedAt: true,
          gradedAt: true,
          scores: true,
          totalScore: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-ink-900">Assignments</h1>
        <p className="mt-1 text-sm text-ink-500">
          Practical work for {batch.name}, graded against a published rubric.
        </p>
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assignments yet"
          description="Your trainer has not set any practical work for this course."
        />
      ) : (
        <Card>
          <ul className="divide-y divide-hair">
            {assignments.map((a) => {
              const mine = a.submissions[0];
              const rubric = coerceRubric(a.rubric);
              const grade = mine ? gradeSubmission(rubric, coerceScores(mine.scores), a.maxPoints) : null;
              const late = mine ? isLate(mine.submittedAt, a.dueAt) : false;

              return (
                <li key={a.id}>
                  <Link
                    href={`/student/assignments/${a.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-3.5 transition-colors hover:bg-sunken"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-ink-900">{a.title}</p>
                        {a.week && <Badge color="slate">Week {a.week.index}</Badge>}
                        {late && <Badge color="amber">Late</Badge>}
                      </div>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {a.maxPoints} points
                        {a.dueAt ? ` · due ${formatDate(a.dueAt)}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {!mine ? (
                        <Badge color="amber">Not submitted</Badge>
                      ) : mine.gradedAt && grade ? (
                        <Badge color="green">
                          {grade.total}/{grade.max}
                        </Badge>
                      ) : (
                        <Badge color="slate">Awaiting grade</Badge>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
