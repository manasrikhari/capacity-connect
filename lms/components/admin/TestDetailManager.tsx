"use client";

import { ArrowLeft, ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { deleteQuestion, deleteTest, toggleTestActive } from "@/app/admin/tests/actions";
import type { Prisma, Question } from "@/app/generated/prisma/client";
import { QuestionFormModal } from "@/components/admin/QuestionFormModal";
import { TestFormModal } from "@/components/admin/TestFormModal";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

type TestWithQuestions = Prisma.TestGetPayload<{ include: { questions: true } }>;

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

export function TestDetailManager({ test }: { test: TestWithQuestions }) {
  const router = useRouter();
  const [editTestOpen, setEditTestOpen] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [pending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function openAddQuestion() {
    setEditingQuestion(null);
    setQuestionModalOpen(true);
  }

  function openEditQuestion(question: Question) {
    setEditingQuestion(question);
    setQuestionModalOpen(true);
  }

  function handleToggleActive() {
    setPendingId("test");
    startTransition(async () => {
      const result = await toggleTestActive(test.id);
      if (result?.error) toast.error(result.error);
      else toast.success("Test status updated");
      setPendingId(null);
    });
  }

  function handleDeleteTest() {
    if (!confirm("Delete this test and all its questions/attempts? This cannot be undone.")) return;
    setPendingId("test");
    startTransition(async () => {
      const result = await deleteTest(test.id);
      if (result?.error) {
        toast.error(result.error);
        setPendingId(null);
      } else {
        toast.success("Test deleted");
        router.push("/admin/tests");
      }
    });
  }

  function handleDeleteQuestion(id: string) {
    if (!confirm("Delete this question?")) return;
    setPendingId(id);
    startTransition(async () => {
      const result = await deleteQuestion(id);
      if (result?.error) toast.error(result.error);
      else toast.success("Question deleted");
      setPendingId(null);
    });
  }

  const totalMarks = test.questions.reduce((sum, q) => sum + q.marks, 0);

  return (
    <div className="space-y-6">
      <Link href="/admin/tests" className="inline-flex items-center gap-1 text-sm text-violet-600 hover:underline">
        <ArrowLeft className="size-4" /> Back to tests
      </Link>

      <Card>
        <CardHeader className="flex-col items-start sm:flex-row sm:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{test.title}</CardTitle>
              <Badge color={test.isActive ? "green" : "slate"}>{test.isActive ? "Active" : "Inactive"}</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {test.subject} · {test.questions.length} question{test.questions.length === 1 ? "" : "s"} ·{" "}
              {totalMarks} marks total
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditTestOpen(true)}>
              <Pencil className="size-3.5" /> Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              loading={pending && pendingId === "test"}
              onClick={handleToggleActive}
            >
              {test.isActive ? "Deactivate" : "Activate"}
            </Button>
            <Link href={`/admin/tests/${test.id}/results`} className={buttonClasses("secondary", "sm")}>
              View results
            </Link>
            <Button
              size="sm"
              variant="danger"
              loading={pending && pendingId === "test"}
              onClick={handleDeleteTest}
            >
              <Trash2 className="size-3.5" /> Delete
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Questions</h2>
        <Button size="sm" onClick={openAddQuestion}>
          <Plus className="size-4" /> Add question
        </Button>
      </div>

      {test.questions.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No questions yet"
          description="Add at least one question before activating this test."
          action={
            <Button onClick={openAddQuestion}>
              <Plus className="size-4" /> Add question
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {test.questions.map((question, index) => {
            const options: Record<(typeof OPTION_LETTERS)[number], string> = {
              A: question.optionA,
              B: question.optionB,
              C: question.optionC,
              D: question.optionD,
            };
            return (
              <Card key={question.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      {index + 1}. {question.question}
                    </p>
                    <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                      {OPTION_LETTERS.map((letter) => (
                        <div
                          key={letter}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-2 py-1 text-sm",
                            question.correctOption === letter
                              ? "bg-emerald-50 text-emerald-700"
                              : "text-slate-600"
                          )}
                        >
                          <span className="font-medium">{letter}.</span>
                          <span>{options[letter]}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      {question.marks} mark{question.marks === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEditQuestion(question)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      loading={pending && pendingId === question.id}
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <TestFormModal open={editTestOpen} onClose={() => setEditTestOpen(false)} test={test} />
      <QuestionFormModal
        key={editingQuestion?.id ?? "create"}
        open={questionModalOpen}
        onClose={() => setQuestionModalOpen(false)}
        testId={test.id}
        question={editingQuestion}
      />
    </div>
  );
}
