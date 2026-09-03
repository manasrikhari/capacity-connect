"use client";

import { useActionState, useEffect } from "react";
import toast from "react-hot-toast";
import { submitTest } from "@/app/student/tests/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { initialActionState } from "@/lib/action-state";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

/** The question shape safe to send to the client — never carries correctOption. */
export type AttemptQuestion = {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  marks: number;
  order: number;
};

export function TestAttemptForm({
  testId,
  questions,
}: {
  testId: string;
  questions: AttemptQuestion[];
}) {
  const [state, formAction, pending] = useActionState(submitTest.bind(null, testId), initialActionState);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!confirm("Submit your answers? You won't be able to change them after submitting.")) {
          event.preventDefault();
        }
      }}
      className="space-y-4"
    >
      {questions.map((question, index) => {
        const options: Record<(typeof OPTION_LETTERS)[number], string> = {
          A: question.optionA,
          B: question.optionB,
          C: question.optionC,
          D: question.optionD,
        };
        return (
          <Card key={question.id}>
            <p className="font-medium text-ink-900">
              {index + 1}. {question.question}
              <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.14em] font-normal text-ink-300">
                {question.marks} mark{question.marks === 1 ? "" : "s"}
              </span>
            </p>
            <div className="mt-3 space-y-2">
              {OPTION_LETTERS.map((letter) => (
                <label
                  key={letter}
                  className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-hair px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-plum-50 has-[:checked]:border-plum-300 has-[:checked]:bg-plum-50"
                >
                  <input
                    type="radio"
                    name={`answer-${question.id}`}
                    value={letter}
                    required
                    className="accent-plum-600"
                  />
                  <span className="font-medium">{letter}.</span> {options[letter]}
                </label>
              ))}
            </div>
          </Card>
        );
      })}

      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          Submit test
        </Button>
      </div>
    </form>
  );
}
