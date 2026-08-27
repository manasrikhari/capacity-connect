"use client";

import { useState, useActionState } from "react";
import { CheckCircle2, Grape, LogIn, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button, buttonClasses } from "@/components/ui/Button";
import { JoinCodeInput } from "@/components/ui/JoinCodeInput";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import {
  studentGoogleSignInAction,
  validateCodeAction,
  type JoinBatchState,
} from "@/app/join/actions";

type Variant = "top-button" | "card" | "empty-state" | "sidebar";

export function JoinBatchTrigger({ variant }: { variant: Variant }) {
  const [openKey, setOpenKey] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  function handleOpen() {
    setOpenKey((k) => k + 1);
    setIsOpen(true);
  }

  return (
    <>
      <TriggerButton variant={variant} onClick={handleOpen} />
      <JoinModal key={openKey} open={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

export function JoinSuccessModal({ batchName }: { batchName: string }) {
  const [open, setOpen] = useState(true);
  const router = useRouter();

  function handleClose() {
    setOpen(false);
    router.replace("/student");
  }

  return (
    <Modal open={open} onClose={handleClose} title="Join a batch">
      <div className="flex flex-col items-center py-4 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="size-7" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800">You&apos;re in!</h2>
        <p className="mt-2 text-sm text-slate-500">
          Request sent — {batchName}. Your teacher will approve you shortly.
        </p>
        <button
          type="button"
          onClick={handleClose}
          className={buttonClasses("primary", "md", "mt-6")}
        >
          Go to my batches
        </button>
      </div>
    </Modal>
  );
}

function TriggerButton({ variant, onClick }: { variant: Variant; onClick: () => void }) {
  if (variant === "top-button") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-300/60 transition-all hover:-translate-y-0.5 hover:bg-violet-700"
      >
        <Plus className="size-4" />
        Join another batch
      </button>
    );
  }

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex min-h-42 w-full flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/60 p-5 text-center transition-all hover:-translate-y-0.5 hover:border-violet-400 hover:bg-white"
      >
        <div className="flex size-10 items-center justify-center rounded-xl border border-violet-200 bg-white text-2xl font-light text-violet-600">
          +
        </div>
        <span className="text-sm font-semibold text-violet-700">Join another batch</span>
        <span className="max-w-42.5 text-xs text-slate-500">
          Got a code from your teacher? Enter it here
        </span>
      </button>
    );
  }

  if (variant === "sidebar") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2 rounded-xl border border-violet-200 px-3 py-1.5 text-[13px] font-medium text-violet-600 transition-colors hover:border-violet-300 hover:bg-violet-50"
      >
        <LogIn className="size-3.5 shrink-0" />
        Join another batch
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
    >
      <LogIn className="size-4" />
      Join your first batch
    </button>
  );
}

function JoinModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<JoinBatchState, FormData>(
    validateCodeAction,
    undefined
  );

  if (state?.phase === "done") {
    function handleGoToBatches() {
      onClose();
      router.replace("/student");
    }

    return (
      <Modal open={open} onClose={handleGoToBatches} title="Join a batch">
        <div className="flex flex-col items-center py-4 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle2 className="size-7" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">You&apos;re in!</h2>
          <p className="mt-2 text-sm text-slate-500">{state.success}</p>
          <button
            type="button"
            onClick={handleGoToBatches}
            className={buttonClasses("primary", "md", "mt-6")}
          >
            Go to my batches
          </button>
        </div>
      </Modal>
    );
  }

  if (state?.phase === "auth" && state.batch) {
    return (
      <Modal open={open} onClose={onClose} title="Join a batch">
        <div className="flex flex-col items-center py-4 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <Grape className="size-7" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">
            Join {state.batch.name}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to request enrollment in this class.
          </p>
          <form action={studentGoogleSignInAction} className="mt-6 w-full">
            <input type="hidden" name="joinCode" value={state.code} />
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-violet-200 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <GoogleIcon className="size-5" />
              Continue with Google
            </button>
          </form>
          <p className="mt-4 text-xs text-slate-400">
            Already have an account?{" "}
            <Link href="/" className="font-medium text-violet-600 hover:underline">
              Sign in first
            </Link>
            , then join.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Join a batch">
      <div className="py-2">
        <div className="mb-5 flex flex-col items-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <Grape className="size-7" />
          </div>
          <p className="mt-3 text-center text-sm text-slate-500">
            Enter the join code your teacher shared to enroll in their batch.
          </p>
        </div>
        <form action={formAction} className="space-y-4">
          <JoinCodeInput
            name="joinCode"
            placeholder="e.g. ABCD-1234"
            required
            autoFocus
            autoComplete="off"
            defaultValue={state?.code}
            className="text-center text-lg tracking-wide"
          />
          {state?.error && (
            <p className="text-center text-sm text-red-600">{state.error}</p>
          )}
          <Button type="submit" loading={pending} className="w-full">
            <LogIn className="size-4" />
            Join batch
          </Button>
        </form>
      </div>
    </Modal>
  );
}
