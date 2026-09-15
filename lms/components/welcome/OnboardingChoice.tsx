"use client";

import { BookOpen, GraduationCap } from "lucide-react";
import { useActionState, useState } from "react";
import {
  createTrainerRequestAction,
  joinBatchIntentAction,
} from "@/app/welcome/actions";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Textarea } from "@/components/ui/Field";
import { initialActionState } from "@/lib/action-state";

/**
 * Step 1 of onboarding. Owns the choice so the two paths are mutually
 * exclusive: picking "I'm a trainer" swaps the whole selection for the request
 * form (the trainee card is hidden, not just pushed below it), and "Back"
 * returns to the two cards. "I'm a trainee" submits straight to step 2.
 */
export function OnboardingChoice() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    createTrainerRequestAction,
    initialActionState,
  );

  if (open) {
    return (
      <form
        action={action}
        className="mt-6 space-y-3 rounded-2xl border border-plum-300 bg-plum-50/40 p-5 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-[10px] bg-plum-100 text-plum-600">
            <GraduationCap className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-900">Request trainer access</p>
            <p className="text-xs text-ink-500">A MoES administrator will review your request.</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Organisation" htmlFor="organisation" error={state?.fieldErrors?.organisation?.[0]}>
            <Input id="organisation" name="organisation" placeholder="e.g. IMD Pune" required />
          </FormField>
          <FormField label="Designation" htmlFor="designation" error={state?.fieldErrors?.designation?.[0]}>
            <Input id="designation" name="designation" placeholder="e.g. Scientist-D" required />
          </FormField>
        </div>
        <FormField label="Department (optional)" htmlFor="department" error={state?.fieldErrors?.department?.[0]}>
          <Input id="department" name="department" placeholder="e.g. Satellite Meteorology" />
        </FormField>
        <FormField label="What do you intend to teach?" htmlFor="intent" error={state?.fieldErrors?.intent?.[0]}>
          <Textarea id="intent" name="intent" rows={3} placeholder="A sentence on the subjects and courses you'd lead." required />
        </FormField>

        {state?.error ? (
          <p className="text-sm text-status-unpaid" role="alert">{state.error}</p>
        ) : null}

        <div className="flex gap-2">
          <Button type="submit" loading={pending}>Submit request</Button>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Back
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border border-hair bg-paper p-5 text-center transition-[background-color,border-color,scale] duration-[var(--dur-press)] ease-[var(--ease-out)] hover:border-plum-300 hover:bg-plum-50 active:scale-[0.98] motion-reduce:active:scale-100 cursor-pointer"
      >
        <span className="flex size-11 items-center justify-center rounded-[10px] bg-plum-100 text-plum-600">
          <GraduationCap className="size-6" />
        </span>
        <span className="text-sm font-semibold text-ink-900">I&apos;m a trainer</span>
        <span className="text-xs text-ink-500">Request approval to build courses</span>
      </button>

      <form action={joinBatchIntentAction} className="h-full">
        <button
          type="submit"
          className="group flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border border-hair bg-paper p-5 text-center transition-[background-color,border-color,scale] duration-[var(--dur-press)] ease-[var(--ease-out)] hover:border-plum-300 hover:bg-plum-50 active:scale-[0.98] motion-reduce:active:scale-100 cursor-pointer"
        >
          <span className="flex size-11 items-center justify-center rounded-[10px] bg-plum-100 text-plum-600">
            <BookOpen className="size-6" />
          </span>
          <span className="text-sm font-semibold text-ink-900">I&apos;m a trainee</span>
          <span className="text-xs text-ink-500">Take courses, earn certificates</span>
        </button>
      </form>
    </div>
  );
}
