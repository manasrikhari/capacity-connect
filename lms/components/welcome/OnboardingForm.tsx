"use client";

import { useActionState } from "react";
import { saveOnboardingAction, skipOnboardingAction } from "@/app/welcome/profile/actions";
import { Button } from "@/components/ui/Button";
import { FieldError, Input, Label, Select } from "@/components/ui/Field";
import { initialActionState } from "@/lib/action-state";
import { DEPARTMENTS, SKILL_CATEGORIES } from "@/lib/taxonomy";

/**
 * The one onboarding screen that asks anything.
 *
 * Kept to a single step rather than a wizard: every field is optional, and the
 * domains are the part that matters most, so they lead.
 */
export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(saveOnboardingAction, initialActionState);

  return (
    <form action={formAction} className="space-y-6">
      <fieldset>
        <legend className="text-sm font-medium text-ink-900">
          Which areas do you work in?
        </legend>
        <p className="mt-0.5 text-xs text-ink-500">
          Pick any that apply. This is what we use to suggest courses.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SKILL_CATEGORIES.map((c) => (
            <label
              key={c}
              className="cursor-pointer rounded-lg border border-hair bg-paper px-3 py-2 text-sm text-ink-700 transition-colors has-[:checked]:border-plum-300 has-[:checked]:bg-plum-50 has-[:checked]:text-plum-700 hover:border-plum-300"
            >
              <input type="checkbox" name="interests" value={c} className="sr-only" />
              {c}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="organisation">Organisation</Label>
          <Select id="organisation" name="organisation" defaultValue="">
            <option value="">Not listed</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="postingLocation">Station or division</Label>
          <Input
            id="postingLocation"
            name="postingLocation"
            placeholder="DWR Chennai"
            autoComplete="off"
          />
          <FieldError>{state?.fieldErrors?.postingLocation?.[0]}</FieldError>
        </div>

        <div>
          <Label htmlFor="designation">Designation</Label>
          <Input id="designation" name="designation" placeholder="Scientist-B" autoComplete="off" />
        </div>

        <div>
          <Label htmlFor="cadre">Cadre</Label>
          <Input id="cadre" name="cadre" placeholder="Met-A" autoComplete="off" />
          <p className="mt-1 text-xs text-ink-300">Used to check course eligibility.</p>
        </div>

        <div>
          <Label htmlFor="yearsExperience">Years of service</Label>
          <Input
            id="yearsExperience"
            name="yearsExperience"
            type="number"
            min={0}
            max={50}
            defaultValue={0}
          />
        </div>
      </div>

      {state?.error && (
        <p className="rounded-xl bg-sunken px-3 py-2 text-sm text-status-unpaid">{state.error}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={pending}>
          Save and continue
        </Button>
        <button
          type="submit"
          formAction={skipOnboardingAction}
          className="cursor-pointer text-sm text-ink-500 transition-colors hover:text-ink-900"
        >
          Skip for now
        </button>
      </div>
    </form>
  );
}
