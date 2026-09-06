"use client";

import Link from "next/link";
import { useActionState } from "react";
import { credentialsSignInAction } from "@/app/actions/auth-actions";
import { initialActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Field";

export function CredentialsSignInForm() {
  const [state, action, pending] = useActionState(
    credentialsSignInAction,
    initialActionState
  );

  return (
    <form action={action} className="space-y-4">
      <FormField label="Email or username" htmlFor="email" error={state?.fieldErrors?.email?.[0]}>
        <Input
          id="email"
          name="email"
          type="text"
          autoComplete="username"
          placeholder="teacher"
          required
        />
      </FormField>
      <FormField
        label="Password"
        htmlFor="password"
        error={state?.fieldErrors?.password?.[0]}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </FormField>

      {state?.error ? (
        <p className="text-sm text-status-unpaid" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" loading={pending} className="w-full">
        Sign in
      </Button>

      <p className="text-center text-sm text-ink-500">
        New here?{" "}
        <Link href="/register" className="text-plum-600 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
