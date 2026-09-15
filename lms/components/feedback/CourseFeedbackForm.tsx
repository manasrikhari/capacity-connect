"use client";

import { Pencil, Star } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { submitFeedbackAction } from "@/app/student/feedback/actions";
import { StarRating } from "@/components/feedback/StarRating";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { FormField, Textarea } from "@/components/ui/Field";
import { initialActionState } from "@/lib/action-state";
import { cn } from "@/lib/utils";

export type ExistingFeedback = {
  overallRating: number;
  contentRating: number | null;
  trainerRating: number | null;
  infrastructureRating: number | null;
  comments: string | null;
  suggestions: string | null;
};

function StaticStars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden="true"
          className={cn(
            "size-5",
            n <= value ? "fill-plum-600 text-plum-600" : "fill-transparent text-hair-strong",
          )}
        />
      ))}
    </div>
  );
}

function ReadOnlyRow({ label, value }: { label: string; value: number | null }) {
  if (value == null) return null;
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-ink-700">{label}</span>
      <StaticStars value={value} />
    </div>
  );
}

export function CourseFeedbackForm({
  courseName,
  feedback,
}: {
  courseName: string;
  feedback: ExistingFeedback | null;
}) {
  const [state, formAction, pending] = useActionState(submitFeedbackAction, initialActionState);
  const [editing, setEditing] = useState(!feedback);

  useEffect(() => {
    if (state?.success) {
      toast.success("Feedback submitted");
      setEditing(false);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  const err = (k: string) => state?.fieldErrors?.[k]?.[0];

  // Read-only view of already-submitted feedback.
  if (feedback && !editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your feedback</CardTitle>
          <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="size-3.5" />
            Edit
          </Button>
        </CardHeader>
        <div className="space-y-3">
          <ReadOnlyRow label="Overall" value={feedback.overallRating} />
          <ReadOnlyRow label="Content" value={feedback.contentRating} />
          <ReadOnlyRow label="Trainer" value={feedback.trainerRating} />
          <ReadOnlyRow label="Infrastructure" value={feedback.infrastructureRating} />
          {feedback.comments && (
            <div className="border-t border-hair pt-3">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">Comments</p>
              <p className="text-sm text-ink-700">{feedback.comments}</p>
            </div>
          )}
          {feedback.suggestions && (
            <div className="border-t border-hair pt-3">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">Suggestions</p>
              <p className="text-sm text-ink-700">{feedback.suggestions}</p>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{feedback ? "Edit feedback" : "Share your feedback"}</CardTitle>
      </CardHeader>
      <p className="mb-5 text-sm text-ink-500">
        How was <span className="text-ink-900">{courseName}</span>? Your ratings help us improve.
      </p>

      <form action={formAction} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <StarRating name="overallRating" label="Overall" defaultValue={feedback?.overallRating ?? 0} required />
          <StarRating name="contentRating" label="Content" defaultValue={feedback?.contentRating ?? 0} />
          <StarRating name="trainerRating" label="Trainer" defaultValue={feedback?.trainerRating ?? 0} />
          <StarRating
            name="infrastructureRating"
            label="Infrastructure"
            defaultValue={feedback?.infrastructureRating ?? 0}
          />
        </div>
        {err("overallRating") && <p className="text-xs text-status-unpaid">{err("overallRating")}</p>}

        <FormField label="Comments" htmlFor="comments" error={err("comments")}>
          <Textarea
            id="comments"
            name="comments"
            defaultValue={feedback?.comments ?? ""}
            placeholder="What worked well?"
          />
        </FormField>
        <FormField label="Suggestions" htmlFor="suggestions" error={err("suggestions")}>
          <Textarea
            id="suggestions"
            name="suggestions"
            defaultValue={feedback?.suggestions ?? ""}
            placeholder="What could be better?"
          />
        </FormField>

        <div className="flex justify-end gap-2 pt-1">
          {feedback && (
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          )}
          <Button type="submit" loading={pending}>
            {feedback ? "Save changes" : "Submit feedback"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
