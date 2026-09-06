"use client";

import { CheckCircle2, Clock, LogIn } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { enrolWithGoogleAction, requestEnrolmentAction } from "@/app/courses/actions";
import type { ApprovalStatus } from "@/app/generated/prisma/enums";
import { Button } from "@/components/ui/Button";

/**
 * `Enrollment.status` reuses the four-value `ApprovalStatus`, so SUSPENDED is
 * representable here even though a trainer never sets it today. It is folded in
 * with REJECTED rather than left to fall through to the enrol button.
 */
export type EnrolViewer =
  | { kind: "signedOut" }
  | { kind: "staff" }
  | { kind: "trainee"; enrolment: ApprovalStatus | "none" };

/**
 * The single call to action on a course page. Every branch ends somewhere
 * useful — a signed-out visitor can enrol in one click without first learning
 * what a join code is, which was the point of the catalogue.
 */
export function EnrolPanel({ batchId, viewer }: { batchId: string; viewer: EnrolViewer }) {
  const [message, setMessage] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  if (viewer.kind === "signedOut") {
    return (
      <form action={enrolWithGoogleAction} className="space-y-2">
        <input type="hidden" name="batchId" value={batchId} />
        <Button type="submit" className="w-full justify-center">
          <LogIn className="size-4" />
          Sign in to request a place
        </Button>
        <p className="text-center text-xs text-ink-300">
          You will be enrolled as soon as the trainer approves.
        </p>
      </form>
    );
  }

  if (viewer.kind === "staff") {
    return (
      <p className="rounded-xl bg-sunken px-3 py-2.5 text-sm text-ink-500">
        You are signed in as staff. Trainees enrol with a trainee account.
      </p>
    );
  }

  if (viewer.enrolment === "APPROVED") {
    return (
      <div className="space-y-2">
        <p className="flex items-center gap-2 rounded-xl bg-sage-50 px-3 py-2.5 text-sm text-sage-700">
          <CheckCircle2 className="size-4 shrink-0" />
          You are enrolled on this course.
        </p>
        <Link href="/student/dashboard" className="block text-center text-sm text-plum-600 hover:underline">
          Go to your dashboard
        </Link>
      </div>
    );
  }

  if (viewer.enrolment === "PENDING") {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-sunken px-3 py-2.5 text-sm text-ink-500">
        <Clock className="size-4 shrink-0" />
        Your request is with the trainer. You will be notified when it is reviewed.
      </p>
    );
  }

  if (viewer.enrolment === "REJECTED" || viewer.enrolment === "SUSPENDED") {
    return (
      <p className="rounded-xl bg-sunken px-3 py-2.5 text-sm text-ink-500">
        A previous request for this course was declined. Contact the trainer if that has changed.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        disabled={pending}
        className="w-full justify-center"
        onClick={() =>
          startTransition(async () => {
            const res = await requestEnrolmentAction(batchId);
            if (res?.error) setMessage({ tone: "bad", text: res.error });
            else if (res?.success) setMessage({ tone: "ok", text: res.success });
          })
        }
      >
        {pending ? "Sending…" : "Request enrolment"}
      </Button>
      {message && (
        <p
          className={
            message.tone === "ok"
              ? "rounded-xl bg-sage-50 px-3 py-2 text-sm text-sage-700"
              : "rounded-xl bg-sunken px-3 py-2 text-sm text-status-unpaid"
          }
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
