import { Clock, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SubmitAssignmentForm } from "@/components/assignments/SubmitAssignmentForm";
import { TrackView } from "@/components/course/TrackView";
import { ThreadView } from "@/components/discussion/ThreadView";
import { MediaViewer } from "@/components/library/MediaViewer";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { getActiveStudentBatch } from "@/lib/batch";
import type { ItemKind } from "@/lib/course-week-db";
import { getThread } from "@/lib/discussion-db";
import { renderMarkdown } from "@/lib/markdown";
import { prisma } from "@/lib/prisma";
import { coerceRubric, coerceScores, gradeSubmission } from "@/lib/rubric";
import { getSession } from "@/lib/session";
import { formatDate } from "@/lib/utils";

const KINDS: ItemKind[] = ["library", "note", "test", "assignment", "thread"];

/**
 * One course item, rendered in the player's right pane.
 *
 * Everything a trainee reads or watches renders here so the rail stays put.
 * A test is the one exception: an attempt gets its own focused page, exactly
 * as SWAYAM opens a quiz in its own view.
 */
export default async function CourseItemPage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const batch = await getActiveStudentBatch(session);
  if (!batch) redirect("/student");

  const { kind, id } = await params;
  if (!KINDS.includes(kind as ItemKind)) notFound();

  if (kind === "note") {
    const note = await prisma.note.findFirst({
      where: { id, batchId: batch.id },
      select: { id: true, title: true, subject: true, content: true, fileUrl: true, updatedAt: true },
    });
    if (!note) notFound();

    return (
      <article className="mx-auto max-w-3xl">
        <TrackView itemType="NOTE" itemId={note.id} />
        <Header title={note.title} chip={note.subject} sub={`Updated ${formatDate(note.updatedAt)}`} />
        {note.fileUrl && (
          <a
            href={note.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-plum-700 hover:underline"
          >
            <ExternalLink className="size-4" />
            Open attachment
          </a>
        )}
        <div className="border-t border-hair pt-4">{renderMarkdown(note.content)}</div>
      </article>
    );
  }

  if (kind === "library") {
    const item = await prisma.libraryItem.findFirst({
      where: { id, batchId: batch.id },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        fileUrl: true,
        mimeType: true,
        durationMins: true,
        subject: true,
      },
    });
    if (!item) notFound();

    return (
      <article className="mx-auto max-w-4xl">
        <TrackView itemType="LIBRARY" itemId={item.id} />
        <Header
          title={item.title}
          chip={item.type.replace(/_/g, " ").toLowerCase()}
          sub={item.durationMins ? `${item.durationMins} min` : item.subject}
        />
        {item.description && <p className="mb-4 text-sm text-ink-500">{item.description}</p>}
        <MediaViewer
          item={{
            title: item.title,
            type: item.type,
            fileUrl: item.fileUrl,
            mimeType: item.mimeType,
          }}
        />
      </article>
    );
  }

  if (kind === "test") {
    const test = await prisma.test.findFirst({
      where: { id, batchId: batch.id, isActive: true },
      select: {
        id: true,
        title: true,
        subject: true,
        durationMins: true,
        passPercent: true,
        closesAt: true,
        _count: { select: { questions: true } },
        attempts: {
          where: { studentId: session.user.id },
          select: { score: true, totalMarks: true, submittedAt: true },
        },
      },
    });
    if (!test) notFound();

    const attempt = test.attempts[0];

    return (
      <article className="mx-auto max-w-3xl">
        <Header title={test.title} chip={test.subject} sub={`${test._count.questions} questions`} />

        <Card className="space-y-4">
          <dl className="space-y-2 text-sm">
            <Row label="Questions">{test._count.questions}</Row>
            {test.durationMins && (
              <Row label="Time">
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5 text-ink-300" />
                  {test.durationMins} min
                </span>
              </Row>
            )}
            <Row label="Pass mark">{test.passPercent}%</Row>
            {test.closesAt && <Row label="Closes">{formatDate(test.closesAt)}</Row>}
          </dl>

          {attempt ? (
            <div className="border-t border-hair pt-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                Your result
              </p>
              <p className="mt-1 font-display text-3xl font-normal tabular-nums text-ink-900">
                {attempt.score}
                <span className="text-lg text-ink-500"> / {attempt.totalMarks}</span>
              </p>
              <p className="mt-1 text-xs text-ink-300">
                Attempted {formatDate(attempt.submittedAt)}
              </p>
            </div>
          ) : (
            <Link
              href={`/student/tests/${test.id}`}
              className="inline-block rounded-lg bg-plum-600 px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-plum-700"
            >
              Start the quiz
            </Link>
          )}
        </Card>
      </article>
    );
  }

  if (kind === "assignment") {
    const assignment = await prisma.assignment.findFirst({
      where: { id, batchId: batch.id, isPublished: true },
      select: {
        id: true,
        title: true,
        brief: true,
        rubric: true,
        maxPoints: true,
        dueAt: true,
        submissions: {
          where: { traineeId: session.user.id },
          select: { body: true, submittedAt: true, gradedAt: true, scores: true, feedback: true },
        },
      },
    });
    if (!assignment) notFound();

    const rubric = coerceRubric(assignment.rubric);
    const mine = assignment.submissions[0] ?? null;
    const grade = mine?.gradedAt
      ? gradeSubmission(rubric, coerceScores(mine.scores), assignment.maxPoints)
      : null;

    return (
      <article className="mx-auto max-w-3xl space-y-5">
        <Header
          title={assignment.title}
          chip="Assignment"
          sub={
            assignment.dueAt
              ? `${assignment.maxPoints} points · due ${formatDate(assignment.dueAt)}`
              : `${assignment.maxPoints} points`
          }
        />
        <p className="whitespace-pre-line text-ink-700">{assignment.brief}</p>

        {rubric.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>How this is marked</CardTitle>
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
      </article>
    );
  }

  // thread
  const thread = await getThread(id);
  if (!thread || thread.batchId !== batch.id) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <ThreadView thread={thread} canModerate={false} />
    </div>
  );
}

function Header({
  title,
  chip,
  sub,
}: {
  title: string;
  chip?: string | null;
  sub?: string | null;
}) {
  return (
    <div className="mb-4">
      {chip && (
        <Badge color="violet">
          <span className="capitalize">{chip}</span>
        </Badge>
      )}
      <h1 className="mt-2 font-display text-2xl font-normal leading-snug text-ink-900">{title}</h1>
      {sub && <p className="mt-1 font-mono text-[11px] text-ink-300">{sub}</p>}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-500">{label}</dt>
      <dd className="text-ink-900">{children}</dd>
    </div>
  );
}
