"use client";

import { AlertTriangle, CheckCircle2, Mail, UserPlus } from "lucide-react";
import { useActionState } from "react";
import { nominateAction, type NominateState } from "@/app/spoc/actions";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { FieldError, Label, Select, Textarea } from "@/components/ui/Field";

const STATUS_COPY: Record<string, { label: string; tone: "ok" | "info" | "bad" }> = {
  enrolled: { label: "Enrolled", tone: "ok" },
  invited: { label: "Invited", tone: "info" },
  already: { label: "Already on the course", tone: "info" },
  invalid: { label: "Skipped", tone: "bad" },
};

/** Field errors that no control on this form renders. */
const RENDERED_FIELDS = new Set(["batchId", "list"]);

function orphanErrors(state: NominateState): string[] {
  const fieldErrors = state?.fieldErrors;
  if (!fieldErrors) return [];
  return Object.entries(fieldErrors)
    .filter(([field]) => !RENDERED_FIELDS.has(field))
    .flatMap(([, messages]) => messages ?? []);
}

export function NominateForm({
  departments,
  courses,
}: {
  departments: { id: string; name: string }[];
  courses: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<NominateState, FormData>(nominateAction, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <UserPlus className="size-5 text-ink-300" />
            Nominate staff
          </span>
        </CardTitle>
      </CardHeader>

      <form action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="batchId">Course</Label>
            <Select id="batchId" name="batchId" required>
              <option value="">Choose a course…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <FieldError>{state?.fieldErrors?.batchId?.[0]}</FieldError>
          </div>

          {departments.length > 1 && (
            <div>
              <Label htmlFor="departmentId">Office</Label>
              <Select id="departmentId" name="departmentId">
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="list">Staff</Label>
          <Textarea
            id="list"
            name="list"
            rows={8}
            required
            placeholder={
              "One per line. Any of these work:\n" +
              "a.kumar@imd.gov.in\n" +
              "A Kumar, a.kumar@imd.gov.in\n" +
              "A Kumar | a.kumar@imd.gov.in | Met-A | Scientist-B"
            }
            className="font-mono text-xs"
          />
          <p className="mt-1 text-xs text-ink-300">
            Existing accounts are enrolled straight away — your office vouching for them replaces the
            trainer&apos;s approval. Everyone else is emailed an invitation.
          </p>
          <FieldError>{state?.fieldErrors?.list?.[0]}</FieldError>
        </div>

        {state?.error && (
          <p className="rounded-xl bg-sunken px-3 py-2 text-sm text-status-unpaid">{state.error}</p>
        )}

        {/* Safety net: a validation error on a field with no visible control
            would otherwise fail the form silently, which is exactly what
            happened when departmentId was validated but not rendered. */}
        {orphanErrors(state).map((msg) => (
          <p key={msg} className="rounded-xl bg-sunken px-3 py-2 text-sm text-status-unpaid">
            {msg}
          </p>
        ))}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-plum-600 px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-plum-700 disabled:opacity-50"
        >
          {pending ? "Sending…" : "Send nominations"}
        </button>
      </form>

      {state?.outcomes && state.outcomes.length > 0 && (
        <div className="mt-6 border-t border-hair pt-4">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
            Result — {state.outcomes.length}{" "}
            {state.outcomes.length === 1 ? "person" : "people"}
          </p>
          <ul className="divide-y divide-hair">
            {state.outcomes.map((o) => {
              const s = STATUS_COPY[o.status] ?? { label: o.status, tone: "info" as const };
              return (
                <li key={o.email} className="flex items-center justify-between gap-3 py-2">
                  <span className="flex min-w-0 items-center gap-2 text-sm text-ink-700">
                    <Mail className="size-3.5 shrink-0 text-ink-300" />
                    <span className="truncate">{o.email}</span>
                  </span>
                  <span
                    className={
                      s.tone === "ok"
                        ? "flex shrink-0 items-center gap-1 text-xs text-sage-700"
                        : s.tone === "bad"
                          ? "shrink-0 text-xs text-status-unpaid"
                          : "shrink-0 text-xs text-ink-500"
                    }
                  >
                    {s.tone === "ok" && <CheckCircle2 className="size-3.5" />}
                    {s.label}
                    {o.detail ? ` — ${o.detail}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {state?.rejected && state.rejected.length > 0 && (
        <div className="mt-4 rounded-xl bg-sunken px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-xs font-medium text-ink-700">
            <AlertTriangle className="size-3.5" />
            {state.rejected.length} line{state.rejected.length === 1 ? "" : "s"} had no email address
          </p>
          <ul className="mt-1 space-y-0.5 font-mono text-[11px] text-ink-500">
            {state.rejected.slice(0, 10).map((r) => (
              <li key={r} className="truncate">
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
