"use client";

import { useActionState } from "react";
import { registerAction, type RegisterState } from "@/app/register/actions";
import { Button } from "@/components/ui/Button";
import { FieldError, Input, Label } from "@/components/ui/Field";
import { initialActionState } from "@/lib/action-state";
import { MIN_PASSWORD } from "@/lib/validations/auth";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(
    registerAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          required
          defaultValue={state?.values?.name ?? ""}
          placeholder="Priya Raghavan"
        />
        <FieldError>{state?.fieldErrors?.name?.[0]}</FieldError>
      </div>

      <div>
        <Label htmlFor="email">Official email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state?.values?.email ?? ""}
          placeholder="priya.raghavan@imd.gov.in"
        />
        <FieldError>{state?.fieldErrors?.email?.[0]}</FieldError>
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD}
        />
        <p className="mt-1 text-xs text-ink-300">
          At least {MIN_PASSWORD} characters.
          {state?.fieldErrors ? " Re-enter both password fields." : ""}
        </p>
        <FieldError>{state?.fieldErrors?.password?.[0]}</FieldError>
      </div>

      <div>
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
        />
        <FieldError>{state?.fieldErrors?.confirm?.[0]}</FieldError>
      </div>

      {state?.error && (
        <p className="rounded-xl bg-sunken px-3 py-2 text-sm text-status-unpaid">{state.error}</p>
      )}

      <Button type="submit" loading={pending} className="w-full">
        Create account
      </Button>

      <p className="text-center text-xs text-ink-300">
        You will be signed in and asked how you want to get started.
      </p>
    </form>
  );
}
