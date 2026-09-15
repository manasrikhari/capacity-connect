"use client";

import { Plus } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { createAssignmentAction } from "@/app/admin/assignments/actions";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/Field";
import { initialActionState } from "@/lib/action-state";

/**
 * Author an assignment and its rubric.
 *
 * The rubric is a textarea of "criterion | points | guidance" lines, mirroring
 * how qualifications and work history are already edited in this codebase —
 * one editing idiom rather than three.
 */
export function AssignmentComposer({
  weeks,
  skills,
}: {
  weeks: { id: string; index: number; title: string }[];
  skills: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createAssignmentAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state?.success]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Plus className="size-5 text-ink-300" />
            New assignment
          </span>
        </CardTitle>
      </CardHeader>

      <form ref={formRef} action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required placeholder="Prepare a district rainfall warning" />
          <FieldError>{state?.fieldErrors?.title?.[0]}</FieldError>
        </div>

        <div>
          <Label htmlFor="brief">Brief</Label>
          <Textarea
            id="brief"
            name="brief"
            rows={4}
            required
            placeholder="What the trainee has to produce, and what good looks like."
          />
          <FieldError>{state?.fieldErrors?.brief?.[0]}</FieldError>
        </div>

        <div>
          <Label htmlFor="rubric">Rubric</Label>
          <Textarea
            id="rubric"
            name="rubric"
            rows={4}
            className="font-mono text-xs"
            placeholder={
              "One criterion per line: label | points | guidance\n" +
              "Analysis | 40 | Identifies the synoptic features\n" +
              "Forecast reasoning | 40 | Justifies the chosen colour code\n" +
              "Communication | 20 | Plain language, impact stated"
            }
          />
          <p className="mt-1 text-xs text-ink-300">
            Leave empty for a single holistic mark. With a rubric, the total points come from the
            criteria.
          </p>
          <FieldError>{state?.fieldErrors?.rubric?.[0]}</FieldError>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <Label htmlFor="maxPoints">Points</Label>
            <Input id="maxPoints" name="maxPoints" type="number" min={1} defaultValue={100} />
          </div>
          <div>
            <Label htmlFor="dueAt">Due</Label>
            <Input id="dueAt" name="dueAt" type="date" />
            <FieldError>{state?.fieldErrors?.dueAt?.[0]}</FieldError>
          </div>
          <div>
            <Label htmlFor="weekId">Week</Label>
            <Select id="weekId" name="weekId" defaultValue="">
              <option value="">Unsorted</option>
              {weeks.map((w) => (
                <option key={w.id} value={w.id}>
                  Week {w.index} — {w.title}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="skillId">Competency</Label>
            <Select id="skillId" name="skillId" defaultValue="">
              <option value="">None</option>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {state?.error && (
          <p className="rounded-xl bg-sunken px-3 py-2 text-sm text-status-unpaid">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-plum-600 px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-plum-700 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create as draft"}
        </button>
      </form>
    </Card>
  );
}
