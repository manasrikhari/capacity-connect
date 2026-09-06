"use client";

import { CheckCircle2, Pin, ShieldCheck } from "lucide-react";
import { useActionState, useEffect, useRef, useTransition } from "react";
import toast from "react-hot-toast";
import { markAnswerAction, replyAction, togglePinAction } from "@/app/actions/discussion";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { FieldError, Textarea } from "@/components/ui/Field";
import { initialActionState } from "@/lib/action-state";
import type { ThreadDetail } from "@/lib/discussion-db";
import { formatDate } from "@/lib/utils";

/**
 * One discussion thread with its replies.
 *
 * `canModerate` is the trainer's view: they can pin the thread and mark exactly
 * one reply as the accepted answer, which is how SWAYAM's forum closes a doubt
 * rather than letting it trail off.
 */
export function ThreadView({
  thread,
  canModerate,
}: {
  thread: ThreadDetail;
  canModerate: boolean;
}) {
  const [state, formAction, pending] = useActionState(replyAction, initialActionState);
  const [busy, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state?.success]);

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {thread.isPinned && <Badge color="violet">Pinned</Badge>}
              {thread.isResolved && <Badge color="green">Answered</Badge>}
              {thread.weekLabel && <Badge color="slate">{thread.weekLabel}</Badge>}
            </div>
            <h1 className="font-display text-2xl font-normal leading-snug text-ink-900">
              {thread.title}
            </h1>
            <p className="mt-1 text-xs text-ink-500">
              {thread.authorName}
              {thread.authorIsStaff ? " · Trainer" : ""} · {formatDate(thread.createdAt)}
            </p>
          </div>

          {canModerate && (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                startTransition(async () => {
                  const res = await togglePinAction(thread.id);
                  if (res?.error) toast.error(res.error);
                })
              }
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-hair px-3 py-1.5 text-xs text-ink-500 transition-colors hover:border-plum-300 hover:text-ink-900 disabled:opacity-50"
            >
              <Pin className="size-3.5" />
              {thread.isPinned ? "Unpin" : "Pin"}
            </button>
          )}
        </div>

        <p className="mt-4 whitespace-pre-line text-ink-700">{thread.body}</p>
      </Card>

      {thread.posts.length > 0 && (
        <ul className="space-y-3">
          {thread.posts.map((p) => (
            <li key={p.id}>
              <Card className={p.isAnswer ? "border-sage-300 bg-sage-50" : undefined}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-ink-900">
                    {p.authorIsStaff && <ShieldCheck className="size-3.5 text-plum-600" />}
                    {p.authorName}
                    {p.authorIsStaff && (
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                        Trainer
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-3">
                    {p.isAnswer && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-sage-700">
                        <CheckCircle2 className="size-3.5" />
                        Accepted answer
                      </span>
                    )}
                    <span className="font-mono text-[11px] text-ink-300">
                      {formatDate(p.createdAt)}
                    </span>
                  </div>
                </div>

                <p className="mt-2 whitespace-pre-line text-ink-700">{p.body}</p>

                {canModerate && !p.isAnswer && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      startTransition(async () => {
                        const res = await markAnswerAction(p.id);
                        if (res?.error) toast.error(res.error);
                        else toast.success("Marked as the answer");
                      })
                    }
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-hair px-3 py-1.5 text-xs text-ink-500 transition-colors hover:border-sage-300 hover:text-sage-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="size-3.5" />
                    Mark as answer
                  </button>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Card>
        <form ref={formRef} action={formAction} className="space-y-3">
          <input type="hidden" name="threadId" value={thread.id} />
          <Textarea name="body" rows={4} required placeholder="Write a reply…" aria-label="Reply" />
          <FieldError>{state?.fieldErrors?.body?.[0]}</FieldError>
          {state?.error && (
            <p className="rounded-xl bg-sunken px-3 py-2 text-sm text-status-unpaid">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-plum-600 px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-plum-700 disabled:opacity-50"
          >
            {pending ? "Posting…" : "Reply"}
          </button>
        </form>
      </Card>
    </div>
  );
}
