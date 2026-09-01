"use client";

import { CheckCircle2, Grape, LogIn } from "lucide-react";
import Link from "next/link";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import {
  studentGoogleSignInAction,
  validateCodeAction,
  type JoinBatchState,
} from "@/app/join/actions";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { JoinCodeInput } from "@/components/ui/JoinCodeInput";

const ERROR_MESSAGES: Record<string, string> = {
  unavailable: "This class isn't accepting students right now.",
  "not-student": "You're signed in as a teacher — students join with a student account.",
};

export default function JoinPage() {
  return (
    <Suspense>
      <JoinPageInner />
    </Suspense>
  );
}

function JoinPageInner() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [state, formAction, pending] = useActionState<JoinBatchState, FormData>(
    validateCodeAction,
    undefined
  );

  if (state?.phase === "done") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-sage-100 text-sage-600">
            <CheckCircle2 className="size-7" />
          </div>
          <h1 className="text-xl font-medium text-ink-900">You&apos;re in!</h1>
          <p className="mt-2 text-sm text-ink-500">{state.success}</p>
          <a href="/student" className={buttonClasses("primary", "md", "mt-6 inline-flex")}>
            Go to my batches
          </a>
        </Card>
      </main>
    );
  }

  if (state?.phase === "auth" && state.batch) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-plum-100 text-plum-600">
            <Grape className="size-7" />
          </div>
          <h1 className="text-center text-xl font-medium text-ink-900">
            Join {state.batch.name}
          </h1>
          <p className="mt-2 text-center text-sm text-ink-500">
            Sign in to request enrollment in this class.
          </p>
          <form action={studentGoogleSignInAction} className="mt-6">
            <input type="hidden" name="joinCode" value={state.code} />
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-[10px] border border-hair bg-paper px-4 py-3 text-sm font-semibold text-ink-700 transition-colors duration-[var(--dur-press)] ease-[var(--ease-out)] hover:border-plum-300 hover:bg-plum-50 focus-visible:ring-2 focus-visible:ring-plum-100 focus-visible:outline-none"
            >
              <GoogleIcon className="size-5" />
              Continue with Google
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-ink-300">
            Already have an account?{" "}
            <Link href="/" className="font-medium text-plum-700 hover:underline">
              Sign in first
            </Link>
            , then join.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-plum-100 text-plum-600">
          <Grape className="size-7" />
        </div>

        <h1 className="text-center text-xl font-medium text-ink-900">
          Join a batch
        </h1>
        <p className="mt-2 text-center text-sm text-ink-500">
          Enter the join code your teacher shared to enroll in their batch.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <JoinCodeInput
              name="joinCode"
              placeholder="e.g. ABCD-1234"
              required
              autoFocus
              autoComplete="off"
              defaultValue={state?.code}
              className="text-center text-lg tracking-wide"
            />
          </div>

          {urlError && ERROR_MESSAGES[urlError] && !state?.error && (
            <p className="text-center text-sm text-status-unpaid">{ERROR_MESSAGES[urlError]}</p>
          )}

          {state?.error && (
            <p className="text-center text-sm text-status-unpaid">{state.error}</p>
          )}

          <Button type="submit" loading={pending} className="w-full">
            <LogIn className="size-4" />
            Join batch
          </Button>
        </form>
      </Card>
    </main>
  );
}
