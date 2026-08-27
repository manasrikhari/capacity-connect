import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Prisma, TestAttempt } from "@/app/generated/prisma/client";
import { TestAttemptForm } from "@/components/student/TestAttemptForm";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getSession } from "@/lib/session";
import { getActiveStudentBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { cn, formatDateTime } from "@/lib/utils";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

type TestWithQuestions = Prisma.TestGetPayload<{ include: { questions: true } }>;

function ResultView({ test, attempt }: { test: TestWithQuestions; attempt: TestAttempt }) {
  const answers = JSON.parse(attempt.answers) as Record<string, string>;
  const percentage = attempt.totalMarks > 0 ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Your score</p>
            <p className="text-2xl font-bold text-slate-800">
              {attempt.score} / {attempt.totalMarks}
            </p>
          </div>
          <Badge color={percentage >= 50 ? "green" : "red"}>{percentage}%</Badge>
        </div>
        <p className="mt-2 text-xs text-slate-400">Submitted {formatDateTime(attempt.submittedAt)}</p>
      </Card>

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
                <p className="font-medium text-slate-800">
                  {index + 1}. {question.question}
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
                        "rounded-lg border px-3 py-2 text-sm",
                        isAnswer
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : isSelected
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-slate-100 text-slate-600"
                      )}
                    >
                      <span className="font-medium">{letter}.</span> {options[letter]}
                      {isSelected && !isAnswer && <span className="ml-2 text-xs">(your answer)</span>}
                      {isAnswer && <span className="ml-2 text-xs">(correct answer)</span>}
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
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
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!test || test.batchId !== batch.id) notFound();

  const attempt = await prisma.testAttempt.findUnique({
    where: { testId_studentId: { testId: id, studentId } },
  });

  if (!test.isActive && !attempt) notFound();

  const totalMarks = test.questions.reduce((sum, q) => sum + q.marks, 0);

  return (
    <div className="space-y-6">
      <Link href="/student/tests" className="inline-flex items-center gap-1.5 text-sm text-violet-600 hover:underline">
        <ArrowLeft className="size-4" />
        Back to tests
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{test.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {test.questions.length} questions &middot; {totalMarks} marks
            </p>
          </div>
          <Badge color="violet">{test.subject}</Badge>
        </div>
      </Card>

      {attempt ? (
        <ResultView test={test} attempt={attempt} />
      ) : (
        <TestAttemptForm testId={test.id} questions={test.questions} />
      )}
    </div>
  );
}
