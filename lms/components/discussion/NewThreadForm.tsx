"use client";

import { MessageSquarePlus } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { createThreadAction } from "@/app/actions/discussion";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { FieldError, Input, Select, Textarea } from "@/components/ui/Field";
import { initialActionState } from "@/lib/action-state";

/** Ask a question. Collapsed until wanted, so it does not dominate the forum. */
export function NewThreadForm({
  batchId,
  weeks,
  label = "Ask a question",
}: {
  batchId: string;
  weeks: { id: string; index: number; title: string }[];
  label?: string;
}) {
  const [state, formAction, pending] = useActionState(createThreadAction, initialActionState);
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the form once the thread is created, so a second question does not
  // start pre-filled with the first.
  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state?.success]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-plum-600 px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-plum-700"
      >
        <MessageSquarePlus className="size-4" />
        {label}
      </button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-ink-500 hover:text-ink-900"
        >
          Cancel
        </button>
      </CardHeader>

      <form ref={formRef} action={formAction} className="space-y-3">
        <input type="hidden" name="batchId" value={batchId} />

        <div>
          <Input name="title" placeholder="What is your question?" required aria-label="Title" />
          <FieldError>{state?.fieldErrors?.title?.[0]}</FieldError>
        </div>

        <div>
          <Textarea
            name="body"
            rows={5}
            required
            placeholder="Give enough detail that someone can answer without asking you to clarify."
            aria-label="Question"
          />
          <FieldError>{state?.fieldErrors?.body?.[0]}</FieldError>
        </div>

        {weeks.length > 0 && (
          <Select name="weekId" defaultValue="" aria-label="Week" className="w-auto">
            <option value="">Not about a specific week</option>
            {weeks.map((w) => (
              <option key={w.id} value={w.id}>
                Week {w.index} — {w.title}
              </option>
            ))}
          </Select>
        )}

        {state?.error && (
          <p className="rounded-xl bg-sunken px-3 py-2 text-sm text-status-unpaid">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-plum-600 px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-plum-700 disabled:opacity-50"
        >
          {pending ? "Posting…" : "Post question"}
        </button>
      </form>
    </Card>
  );
}
