"use client";

import { CheckCircle2, Mail, UserPlus } from "lucide-react";
import { useActionState } from "react";
import { inviteTraineesAction, type InviteTraineesState } from "@/app/admin/students/actions";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { FieldError, Textarea } from "@/components/ui/Field";

const LABEL: Record<string, string> = {
  enrolled: "Enrolled",
  invited: "Invited",
  already: "Already on the course",
  invalid: "Skipped",
};

/**
 * Add trainees by email, rather than waiting for them to find a join code.
 * The trainer's own invitation counts as the approval, so an existing account
 * lands enrolled straight away.
 */
export function InviteTraineesCard() {
  const [state, formAction, pending] = useActionState<InviteTraineesState, FormData>(
    inviteTraineesAction,
    null,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <UserPlus className="size-5 text-ink-300" />
            Add trainees by email
          </span>
        </CardTitle>
      </CardHeader>

      <form action={formAction} className="space-y-3">
        <Textarea
          name="list"
          rows={4}
          required
          placeholder={"a.kumar@imd.gov.in\nR Devi, r.devi@imd.gov.in"}
          className="font-mono text-xs"
          aria-label="Email addresses, one per line"
        />
        <FieldError>{state?.fieldErrors?.list?.[0]}</FieldError>
        {state?.error && (
          <p className="rounded-xl bg-sunken px-3 py-2 text-sm text-status-unpaid">{state.error}</p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-plum-600 px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-plum-700 disabled:opacity-50"
          >
            {pending ? "Sending…" : "Invite"}
          </button>
          <p className="text-xs text-ink-300">
            Existing accounts are enrolled immediately; the rest are emailed an invitation.
          </p>
        </div>
      </form>

      {state?.outcomes && state.outcomes.length > 0 && (
        <ul className="mt-4 divide-y divide-hair border-t border-hair pt-2">
          {state.outcomes.map((o) => (
            <li key={o.email} className="flex items-center justify-between gap-3 py-2">
              <span className="flex min-w-0 items-center gap-2 text-sm text-ink-700">
                <Mail className="size-3.5 shrink-0 text-ink-300" />
                <span className="truncate">{o.email}</span>
              </span>
              <span
                className={
                  o.status === "enrolled"
                    ? "flex shrink-0 items-center gap-1 text-xs text-sage-700"
                    : o.status === "invalid"
                      ? "shrink-0 text-xs text-status-unpaid"
                      : "shrink-0 text-xs text-ink-500"
                }
              >
                {o.status === "enrolled" && <CheckCircle2 className="size-3.5" />}
                {LABEL[o.status] ?? o.status}
                {o.detail ? ` — ${o.detail}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
