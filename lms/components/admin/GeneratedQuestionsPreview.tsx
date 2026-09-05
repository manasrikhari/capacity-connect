"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { insertGeneratedQuestionsAction } from "@/app/actions/assessment-generator";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import { MathText } from "@/components/ui/MathText";
import { initialActionState } from "@/lib/action-state";
import { hasMath } from "@/lib/math-segments";
import type { GeneratedQuestion } from "@/lib/validations/generated-question";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;
type OptionKey = "optionA" | "optionB" | "optionC" | "optionD";
const OPTION_KEY: Record<(typeof OPTION_LETTERS)[number], OptionKey> = {
  A: "optionA",
  B: "optionB",
  C: "optionC",
  D: "optionD",
};

export function GeneratedQuestionsPreview({
  testId,
  source,
  questions: initialQuestions,
}: {
  testId: string;
  source: "llm" | "bank";
  questions: GeneratedQuestion[];
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState<GeneratedQuestion[]>(initialQuestions);
  const [state, formAction, pending] = useActionState(insertGeneratedQuestionsAction, initialActionState);

  useEffect(() => {
    if (state?.success) {
      toast.success("Questions added to test");
      router.push(`/admin/tests/${testId}`);
    } else if (state?.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function patch(index: number, changes: Partial<GeneratedQuestion>) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...changes } : q)));
  }

  function removeRow(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-hair-strong pb-2">
        <div className="flex items-center gap-2">
          <h2 className="font-sans text-sm font-semibold text-ink-900">Review questions</h2>
          {source === "bank" && <Badge color="amber">Offline bank</Badge>}
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
          {questions.length} drafted
        </span>
      </div>

      {questions.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-500">
            No questions left to add. Generate again to draft a fresh set.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((q, index) => (
            <Card key={index} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                  Question {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  aria-label="Delete question"
                  className="rounded-full p-1 text-ink-300 transition-colors hover:bg-status-unpaid/10 hover:text-status-unpaid"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <Textarea
                aria-label={`Question ${index + 1} text`}
                value={q.question}
                onChange={(e) => patch(index, { question: e.target.value })}
                className="min-h-20"
              />
              {hasMath(q.question) && (
                <p className="rounded-[10px] bg-sunken px-3 py-2 text-sm text-ink-700">
                  <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                    Preview
                  </span>
                  <MathText text={q.question} />
                </p>
              )}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {OPTION_LETTERS.map((letter) => (
                  <label
                    key={letter}
                    className="flex items-center gap-2 rounded-[10px] border border-hair px-2 py-1.5 has-[:checked]:border-sage-200 has-[:checked]:bg-sage-50"
                  >
                    <input
                      type="radio"
                      name={`correct-${index}`}
                      checked={q.correctOption === letter}
                      onChange={() => patch(index, { correctOption: letter })}
                      className="accent-sage-600"
                      aria-label={`Mark option ${letter} correct`}
                    />
                    <span className="font-medium text-ink-700">{letter}.</span>
                    <Input
                      aria-label={`Option ${letter}`}
                      value={q[OPTION_KEY[letter]]}
                      onChange={(e) => patch(index, { [OPTION_KEY[letter]]: e.target.value })}
                      className="border-0 bg-transparent px-1 py-0 focus:ring-0"
                    />
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor={`difficulty-${index}`}>Difficulty</Label>
                  <Select
                    id={`difficulty-${index}`}
                    value={q.difficulty}
                    onChange={(e) =>
                      patch(index, { difficulty: e.target.value as GeneratedQuestion["difficulty"] })
                    }
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`tag-${index}`}>Competency tag</Label>
                  <Input
                    id={`tag-${index}`}
                    value={q.competencyTag ?? ""}
                    onChange={(e) => patch(index, { competencyTag: e.target.value || null })}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor={`explanation-${index}`}>Explanation</Label>
                <Textarea
                  id={`explanation-${index}`}
                  value={q.explanation}
                  onChange={(e) => patch(index, { explanation: e.target.value })}
                  className="min-h-16"
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      <form action={formAction} className="flex justify-end">
        <input type="hidden" name="testId" value={testId} />
        <input type="hidden" name="questions" value={JSON.stringify(questions)} />
        <Button type="submit" loading={pending} disabled={questions.length === 0}>
          Add {questions.length} question{questions.length === 1 ? "" : "s"} to test
        </Button>
      </form>
    </div>
  );
}
