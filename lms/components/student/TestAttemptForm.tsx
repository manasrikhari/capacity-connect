"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { submitTest } from "@/app/student/tests/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { initialActionState } from "@/lib/action-state";
import { cn } from "@/lib/utils";

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

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export function TestAttemptForm({
  testId,
  questions,
  durationMins,
}: {
  testId: string;
  questions: AttemptQuestion[];
  durationMins?: number | null;
}) {
  const [state, formAction, pending] = useActionState(submitTest.bind(null, testId), initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  // Skips the confirm dialog when the countdown forces a submit.
  const autoSubmitRef = useRef(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  // NOTE: the per-attempt start time is client-side only in this iteration
  // (persisted in sessionStorage so a refresh doesn't reset the clock). The
  // server still enforces the test's closesAt window on submit; the countdown
  // is a UX aid, not a security boundary.
  useEffect(() => {
    if (!durationMins || durationMins <= 0) return;

    const storageKey = `test-start:${testId}`;
    let startedAt = Date.now();
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const parsed = Number(stored);
        if (Number.isFinite(parsed)) startedAt = parsed;
        else sessionStorage.setItem(storageKey, String(startedAt));
      } else {
        sessionStorage.setItem(storageKey, String(startedAt));
      }
    } catch {
      /* sessionStorage unavailable — fall back to this mount's start time */
    }

    const deadline = startedAt + durationMins * 60_000;
    const tick = () => {
      const secondsLeft = Math.round((deadline - Date.now()) / 1000);
      setRemaining(secondsLeft);
      if (secondsLeft <= 0) {
        clearInterval(interval);
        // Auto-submit at zero, bypassing the confirm dialog.
        autoSubmitRef.current = true;
        formRef.current?.requestSubmit();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [durationMins, testId]);

  const timed = typeof durationMins === "number" && durationMins > 0;
  const critical = remaining !== null && remaining <= 60;

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={(event) => {
        if (autoSubmitRef.current) {
          autoSubmitRef.current = false;
          return;
        }
        if (!confirm("Submit your answers? You won't be able to change them after submitting.")) {
          event.preventDefault();
        }
      }}
      className="space-y-4"
    >
      {timed && (
        <div className="sticky top-2 z-10 flex items-center justify-between rounded-[10px] border border-hair bg-paper px-4 py-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
            Time remaining
          </span>
          <span
            className={cn(
              "font-mono text-base tabular-nums",
              critical ? "text-status-unpaid" : "text-ink-900"
            )}
            aria-live={critical ? "assertive" : "off"}
          >
            {remaining === null ? "--:--" : formatClock(remaining)}
          </span>
        </div>
      )}

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
