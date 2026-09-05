import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Prisma, TestAttempt } from "@/app/generated/prisma/client";
import { TestAttemptForm, type AttemptQuestion } from "@/components/student/TestAttemptForm";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MathText } from "@/components/ui/MathText";
import { getSession } from "@/lib/session";
import { getActiveStudentBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { cn, formatDateTime, isTestOpen } from "@/lib/utils";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

type TestWithQuestions = Prisma.TestGetPayload<{
  include: { questions: { include: { skill: true } }; skill: true };
}>;

function ResultView({ test, attempt }: { test: TestWithQuestions; attempt: TestAttempt }) {
  let answers: Record<string, string> = {};
  let corrupt = false;
  try {
    answers = JSON.parse(attempt.answers) as Record<string, string>;
  } catch {
    corrupt = true;
  }
  const percentage = attempt.totalMarks > 0 ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0;
  const passed = percentage >= test.passPercent;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-ink-500">Your score</p>
            <p className="font-display text-3xl font-normal tabular-nums text-ink-900">
              {attempt.score} / {attempt.totalMarks}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge color={passed ? "green" : "red"}>{passed ? "Passed" : "Failed"}</Badge>
            <Badge color={passed ? "green" : "red"}>{percentage}%</Badge>
          </div>
        </div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
          Pass mark {test.passPercent}% &middot; Submitted {formatDateTime(attempt.submittedAt)}
        </p>
      </Card>

      {corrupt ? (
        <EmptyState
          icon={Lock}
          title="Answers unavailable"
          description="We couldn't read your saved answers, but your score above still stands."
        />
      ) : (
        <div className="space-y-3">
          {test.questions.map((question, index) => {
            const selected = answers[question.id];
            const isCorrect = selected === question.correctOption;
            const options: Record<(typeof OPTION_LETTERS)[number], string> = {
              A: question.optionA,
              B: question.optionB,
              C: question.optionC,
              D: question.optionD,
            };
            return (
              <Card key={question.id}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-ink-900">
                    {index + 1}. <MathText text={question.question} />
                  </p>
                  <Badge color={isCorrect ? "green" : "red"}>{isCorrect ? "Correct" : "Incorrect"}</Badge>
                </div>
                <div className="mt-3 space-y-2">
                  {OPTION_LETTERS.map((letter) => {
                    const isSelected = selected === letter;
                    const isAnswer = question.correctOption === letter;
                    return (
                      <div
                        key={letter}
                        className={cn(
                          "rounded-[10px] border px-3 py-2 text-sm",
                          isAnswer
                            ? "border-sage-200 bg-sage-50 text-sage-700"
                            : isSelected
                              ? "border-status-unpaid/25 bg-status-unpaid/10 text-status-unpaid"
                              : "border-hair text-ink-700"
                        )}
                      >
                        <span className="font-medium">{letter}.</span> <MathText text={options[letter]} />
                        {isSelected && !isAnswer && <span className="ml-2 text-xs">(your answer)</span>}
                        {isAnswer && <span className="ml-2 text-xs">(correct answer)</span>}
                      </div>
                    );
                  })}
                </div>
                {question.explanation && (
                  <p className="mt-3 rounded-[10px] bg-sunken px-3 py-2 text-sm text-ink-700">
                    <span className="font-medium text-ink-900">Why:</span> <MathText text={question.explanation} />
                  </p>
                )}
                {question.skill && (
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                    Competency: {question.skill.name}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default async function StudentTestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");
  const batch = await getActiveStudentBatch(session);
  if (!batch) redirect("/student");

  const { id } = await params;
  const studentId = session.user.id;

  const test = await prisma.test.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { order: "asc" }, include: { skill: true } },
      skill: true,
    },
  });
  if (!test || test.batchId !== batch.id) notFound();

  const attempt = await prisma.testAttempt.findUnique({
    where: { testId_studentId: { testId: id, studentId } },
  });

  if (!test.isActive && !attempt) notFound();

  const totalMarks = test.questions.reduce((sum, q) => sum + q.marks, 0);
  const open = isTestOpen(test);

  // Never send correctOption to the client before submission.
  const safeQuestions: AttemptQuestion[] = test.questions.map((q) => ({
    id: q.id,
    question: q.question,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    marks: q.marks,
    order: q.order,
  }));

  return (
    <div className="space-y-6">
      <Link href="/student/tests" className="inline-flex items-center gap-1.5 text-sm text-plum-700 hover:underline">
        <ArrowLeft className="size-4" />
        Back to tests
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-medium text-ink-900">{test.title}</h1>
            <p className="mt-1 text-sm text-ink-500">
              {test.questions.length} questions &middot; {totalMarks} marks
            </p>
            {test.durationMins && !attempt && open && (
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                Timed &middot; {test.durationMins} min
              </p>
            )}
            {test.closesAt && (
              <p className={cn("mt-1 text-xs", open ? "text-ink-500" : "text-status-unpaid")}>
                {open ? `Closes ${formatDateTime(test.closesAt)}` : "Closed"}
              </p>
            )}
          </div>
          <Badge color="violet">{test.subject}</Badge>
        </div>
      </Card>

      {attempt ? (
        <ResultView test={test} attempt={attempt} />
      ) : open ? (
        <TestAttemptForm testId={test.id} questions={safeQuestions} durationMins={test.durationMins} />
      ) : (
        <EmptyState
          icon={Lock}
          title="This test has closed"
          description="The window to attempt this test has passed, so it can no longer be taken."
        />
      )}
    </div>
  );
}
