"use client";

import { Check, Copy, ShieldAlert, ShieldCheck, ShieldX, SearchX } from "lucide-react";
import { useState } from "react";

export type VerifyView =
  | { found: false }
  | {
      found: true;
      isValid: boolean;
      isTamperFree: boolean;
      recipient: { name: string; designation: string | null; department: string | null };
      course: { name: string; subject: string | null; wmoTier: string | null };
      grade: string | null;
      scorePercent: number | null;
      issueDateLabel: string;
      certificateNumber: string;
      verificationHash: string;
      status: string;
    };

type Status = "valid" | "revoked" | "tampered" | "notfound";

function resolveStatus(view: VerifyView): Status {
  if (!view.found) return "notfound";
  if (!view.isTamperFree) return "tampered";
  if (!view.isValid) return "revoked";
  return "valid";
}

const STATUS_META: Record<
  Status,
  { label: string; sub: string; icon: typeof ShieldCheck; tone: string; iconTone: string }
> = {
  valid: {
    label: "Valid",
    sub: "This is a genuine, active credential.",
    icon: ShieldCheck,
    tone: "border-sage-600/30 bg-sage-50 text-sage-700",
    iconTone: "bg-sage-100 text-sage-700",
  },
  revoked: {
    label: "Revoked",
    sub: "This certificate was issued but has since been revoked.",
    icon: ShieldX,
    tone: "border-status-unpaid/25 bg-status-unpaid/8 text-status-unpaid",
    iconTone: "bg-status-unpaid/12 text-status-unpaid",
  },
  tampered: {
    label: "Tampered",
    sub: "The signature does not match — these details were altered.",
    icon: ShieldAlert,
    tone: "border-status-unpaid/25 bg-status-unpaid/8 text-status-unpaid",
    iconTone: "bg-status-unpaid/12 text-status-unpaid",
  },
  notfound: {
    label: "Not found",
    sub: "No certificate matches that number or hash.",
    icon: SearchX,
    tone: "border-hair-strong bg-sunken/40 text-ink-700",
    iconTone: "bg-sunken text-ink-500",
  },
};

export function VerifyResult({ view }: { view: VerifyView }) {
  const status = resolveStatus(view);
  const meta = STATUS_META[status];
  const Icon = meta.icon;

  return (
    <div className="space-y-4">
      {/* Big status banner */}
      <div className={`flex items-center gap-4 rounded-2xl border p-5 ${meta.tone}`}>
        <div className={`flex size-12 shrink-0 items-center justify-center rounded-full ${meta.iconTone}`}>
          <Icon className="size-6" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-3xl leading-none">{meta.label}</p>
          <p className="mt-1.5 text-sm opacity-90">{meta.sub}</p>
        </div>
      </div>

      {/* Details (only when a record exists) */}
      {view.found && (
        <div className="space-y-4 rounded-2xl border border-hair bg-paper p-5">
          <Row label="Recipient" value={view.recipient.name} />
          {view.recipient.designation && <Row label="Designation" value={view.recipient.designation} />}
          {view.recipient.department && <Row label="Department" value={view.recipient.department} />}
          <div className="border-t border-hair pt-4">
            <Row label="Course" value={view.course.name} />
            {view.course.wmoTier && <Row label="WMO tier" value={view.course.wmoTier} mono />}
          </div>
          <div className="border-t border-hair pt-4">
            {view.grade && (
              <Row
                label="Grade"
                value={
                  view.scorePercent !== null ? `${view.grade} · ${view.scorePercent}%` : view.grade
                }
              />
            )}
            <Row label="Issued" value={view.issueDateLabel} mono />
            <Row label="Certificate no." value={view.certificateNumber} mono />
            <HashRow hash={view.verificationHash} />
          </div>
        </div>
      )}

      <p className="flex items-start gap-1.5 text-xs text-ink-300">
        <ShieldCheck className="mt-px size-3.5 shrink-0" />
        This credential is cryptographically verified with an HMAC-SHA256 signature over the
        certificate number, recipient, course and issue date.
      </p>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-1">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">{label}</span>
      <span
        className={
          mono
            ? "font-mono text-sm text-ink-900 tabular-nums"
            : "text-right text-sm font-medium text-ink-900"
        }
      >
        {value}
      </span>
    </div>
  );
}

function HashRow({ hash }: { hash: string }) {
  const [copied, setCopied] = useState(false);
  const truncated = `${hash.slice(0, 10)}…${hash.slice(-8)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-1">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
        Signature
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="font-mono text-sm text-ink-700 tabular-nums">{truncated}</span>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy full signature"
          className="rounded-[6px] p-1 text-ink-300 transition-colors hover:bg-sunken hover:text-ink-700"
        >
          {copied ? <Check className="size-3.5 text-sage-700" /> : <Copy className="size-3.5" />}
        </button>
      </span>
    </div>
  );
}
