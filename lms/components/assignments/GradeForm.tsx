"use client";

import { useActionState } from "react";
import { gradeSubmissionAction } from "@/app/admin/assignments/actions";
import { FieldError, Input, Label, Textarea } from "@/components/ui/Field";
import { initialActionState } from "@/lib/action-state";
import type { CriterionScore, RubricCriterion } from "@/lib/rubric";

/**
 * Score one submission against the rubric.
 *
 * Each criterion posts as `score:<label>`, so the form is rendered straight
 * from the rubric with no second source of truth about criterion names.
 */
export function GradeForm({
  submissionId,
  rubric,
  maxPoints,
  existing,
  feedback,
}: {
  submissionId: string;
  rubric: RubricCriterion[];
  maxPoints: number;
  existing: CriterionScore[];
  feedback: string | null;
}) {
  const [state, formAction, pending] = useActionState(gradeSubmissionAction, initialActionState);
  const byLabel = new Map(existing.map((s) => [s.label, s.points]));

  const criteria: RubricCriterion[] =
    rubric.length > 0 ? rubric : [{ label: "Overall", maxPoints }];

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="submissionId" value={submissionId} />

      <div className="space-y-3">
        {criteria.map((c) => (
          <div key={c.label} className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <Label htmlFor={`score:${c.label}`}>{c.label}</Label>
              {c.guidance && <p className="text-xs text-ink-300">{c.guidance}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Input
                id={`score:${c.label}`}
                name={`score:${c.label}`}
                type="number"
                min={0}
                max={c.maxPoints}
                defaultValue={byLabel.get(c.label) ?? ""}
                className="w-20"
              />
              <span className="font-mono text-xs text-ink-300">/ {c.maxPoints}</span>
            </div>
          </div>
        ))}
      </div>

      <div>
        <Label htmlFor="feedback">Feedback</Label>
        <Textarea
          id="feedback"
          name="feedback"
          rows={3}
          defaultValue={feedback ?? ""}
          placeholder="What was strong, and what to do differently next time."
        />
        <FieldError>{state?.fieldErrors?.feedback?.[0]}</FieldError>
      </div>

      {state?.error && (
        <p className="rounded-xl bg-sunken px-3 py-2 text-sm text-status-unpaid">{state.error}</p>
      )}
      {state?.success && (
        <p className="rounded-xl bg-sage-50 px-3 py-2 text-sm text-sage-700">Grade saved.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-plum-600 px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-plum-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save grade"}
      </button>
    </form>
  );
}
