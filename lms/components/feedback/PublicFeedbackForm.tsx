"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "done" | "error";

const CATEGORIES = [
  { value: "general", label: "General feedback" },
  { value: "suggestion", label: "Suggestion" },
  { value: "accessibility", label: "Accessibility barrier" },
  { value: "grievance", label: "Grievance" },
];

const field =
  "mt-1.5 w-full rounded-[10px] border border-hair bg-paper px-3 py-2 text-ink-900 outline-none focus:border-plum-300 focus:ring-2 focus:ring-plum-100";
const labelCls = "block text-[13px] font-medium text-ink-700";

/**
 * The public feedback / grievance form. Posts to /api/public-feedback and shows
 * an inline confirmation — a real, unauthenticated GIGW feedback channel.
 */
export function PublicFeedbackForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/api/public-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("done");
        form.reset();
      } else {
        setStatus("error");
        setError(json?.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setError("Could not reach the server. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-sage-200 bg-sage-50 p-5 text-ink-700"
      >
        <p className="font-display text-lg text-ink-900">Thank you</p>
        <p className="mt-1 text-[14px]">
          Your feedback has been recorded. If you asked for a response, the training cell will follow up through
          your department&rsquo;s SPOC.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-3 rounded-[10px] px-3 py-1.5 text-[13px] font-medium text-plum-700 hover:bg-plum-50"
        >
          Submit another response
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fb-name" className={labelCls}>Name <span className="text-ink-300">(optional)</span></label>
          <input id="fb-name" name="name" type="text" maxLength={120} autoComplete="name" className={field} />
        </div>
        <div>
          <label htmlFor="fb-email" className={labelCls}>Email <span className="text-ink-300">(optional)</span></label>
          <input id="fb-email" name="email" type="email" maxLength={200} autoComplete="email" className={field} />
        </div>
      </div>

      <div>
        <label htmlFor="fb-category" className={labelCls}>Category</label>
        <select id="fb-category" name="category" defaultValue="general" className={field}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="fb-message" className={labelCls}>Message</label>
        <textarea id="fb-message" name="message" required minLength={3} maxLength={4000} rows={5} className={field} />
      </div>

      {status === "error" && error ? (
        <p role="alert" className="text-[13px] text-status-unpaid">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-[10px] bg-plum-600 px-4 py-2 text-[14px] font-medium text-paper transition-colors hover:bg-plum-700 active:scale-[0.97] disabled:opacity-60"
      >
        {status === "submitting" ? "Sending…" : "Submit feedback"}
      </button>
    </form>
  );
}
