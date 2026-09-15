"use client";

import { GraduationCap } from "lucide-react";
import { useActionState, useState } from "react";
import { createTrainerRequestAction } from "@/app/welcome/actions";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Textarea } from "@/components/ui/Field";
import { initialActionState } from "@/lib/action-state";

/**
 * The trainer path is now a governed request, not a self-promotion. Picking
 * "I'm a trainer" reveals a short form; submitting files a TrainerRequest that a
 * MoES admin reviews on /platform. The caller stays a trainee until approved.
 */
export function TrainerRequestCard() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    createTrainerRequestAction,
    initialActionState,
  );

  if (!open) {
    return (
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
    );
  }

  return (
    <form action={action} className="space-y-3 rounded-2xl border border-plum-300 bg-plum-50/40 p-5 text-left sm:col-span-2">
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
