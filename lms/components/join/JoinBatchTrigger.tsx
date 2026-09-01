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
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-sage-100 text-sage-600">
          <CheckCircle2 className="size-7" />
        </div>
        <h2 className="text-xl font-medium text-ink-900">You&apos;re in!</h2>
        <p className="mt-2 text-sm text-ink-500">
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
      <Button type="button" onClick={onClick} size="lg">
        <Plus className="size-4" />
        Join another batch
      </Button>
    );
  }

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex min-h-42 w-full flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-hair-strong bg-sunken/40 p-5 text-center transition-[background-color,border-color] duration-[var(--dur-press)] ease-[var(--ease-out)] hover:border-plum-300 hover:bg-plum-50"
      >
        <div className="flex size-10 items-center justify-center rounded-[10px] border border-hair bg-paper text-2xl font-light text-plum-600">
          +
        </div>
        <span className="text-sm font-semibold text-plum-700">Join another batch</span>
        <span className="max-w-42.5 text-xs text-ink-500">
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
        className="flex items-center gap-2 rounded-[10px] border border-hair px-3 py-1.5 text-[13px] font-medium text-plum-700 transition-colors hover:border-plum-300 hover:bg-plum-50"
      >
        <LogIn className="size-3.5 shrink-0" />
        Join another batch
      </button>
    );
  }

  return (
    <Button type="button" onClick={onClick} className="mt-6">
      <LogIn className="size-4" />
      Join your first batch
    </Button>
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
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-sage-100 text-sage-600">
            <CheckCircle2 className="size-7" />
          </div>
          <h2 className="text-xl font-medium text-ink-900">You&apos;re in!</h2>
          <p className="mt-2 text-sm text-ink-500">{state.success}</p>
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
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-plum-100 text-plum-600">
            <Grape className="size-7" />
          </div>
          <h2 className="text-xl font-medium text-ink-900">
            Join {state.batch.name}
          </h2>
          <p className="mt-2 text-sm text-ink-500">
            Sign in to request enrollment in this class.
          </p>
          <form action={studentGoogleSignInAction} className="mt-6 w-full">
            <input type="hidden" name="joinCode" value={state.code} />
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-[10px] border border-hair bg-paper px-4 py-3 text-sm font-semibold text-ink-700 transition-colors duration-[var(--dur-press)] ease-[var(--ease-out)] hover:border-plum-300 hover:bg-plum-50 focus-visible:ring-2 focus-visible:ring-plum-100 focus-visible:outline-none"
            >
              <GoogleIcon className="size-5" />
              Continue with Google
            </button>
          </form>
          <p className="mt-4 text-xs text-ink-300">
            Already have an account?{" "}
            <Link href="/" className="font-medium text-plum-700 hover:underline">
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
          <div className="flex size-14 items-center justify-center rounded-full bg-plum-100 text-plum-600">
            <Grape className="size-7" />
          </div>
          <p className="mt-3 text-center text-sm text-ink-500">
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
            <p className="text-center text-sm text-status-unpaid">{state.error}</p>
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
