"use client";

import { Lock } from "lucide-react";
import { useActionState } from "react";
import { submitAssignmentAction } from "@/app/student/assignments/actions";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { FieldError, Textarea } from "@/components/ui/Field";
import { initialActionState } from "@/lib/action-state";
import { formatDate } from "@/lib/utils";

/**
 * Submit or revise an assignment.
 *
 * Revision stays open until the trainer grades it — a trainee spotting a
 * mistake five minutes later should not have to ask for anything to be deleted.
 * Once graded, the work is frozen and shown read-only.
 */
export function SubmitAssignmentForm({
  assignmentId,
  existingBody,
  isGraded,
  submittedAt,
}: {
  assignmentId: string;
  existingBody: string;
  isGraded: boolean;
  submittedAt: Date | null;
}) {
  const [state, formAction, pending] = useActionState(submitAssignmentAction, initialActionState);

  if (isGraded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Lock className="size-5 text-ink-300" />
              Your submission
            </span>
          </CardTitle>
          {submittedAt && (
            <span className="font-mono text-[11px] text-ink-300">{formatDate(submittedAt)}</span>
          )}
        </CardHeader>
        <p className="whitespace-pre-line rounded-xl bg-sunken px-4 py-3 text-sm text-ink-700">
          {existingBody}
        </p>
        <p className="mt-2 text-xs text-ink-300">
          This has been graded, so it can no longer be changed.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{existingBody ? "Revise your submission" : "Your submission"}</CardTitle>
        {submittedAt && (
          <span className="font-mono text-[11px] text-ink-300">
            Last saved {formatDate(submittedAt)}
          </span>
        )}
      </CardHeader>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="assignmentId" value={assignmentId} />
        <Textarea
          name="body"
          rows={10}
          required
          defaultValue={existingBody}
          placeholder="Write your answer here."
          aria-label="Your submission"
        />
        <FieldError>{state?.fieldErrors?.body?.[0]}</FieldError>

        {state?.error && (
          <p className="rounded-xl bg-sunken px-3 py-2 text-sm text-status-unpaid">{state.error}</p>
        )}
        {state?.success && (
          <p className="rounded-xl bg-sage-50 px-3 py-2 text-sm text-sage-700">
            Submitted. You can keep revising until your trainer grades it.
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-plum-600 px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-plum-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : existingBody ? "Save changes" : "Submit"}
        </button>
      </form>
    </Card>
  );
}
