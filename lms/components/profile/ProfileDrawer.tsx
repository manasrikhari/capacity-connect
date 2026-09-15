"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  X,
  ArrowLeft,
  Trash2,
  AlertTriangle,
  BookOpen,
  Shield,
  GraduationCap,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getProfileData, deleteAccountAction } from "@/app/actions/account-actions";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getInitials, plumSphere } from "@/components/ui/avatar";

type ProfileData = NonNullable<Awaited<ReturnType<typeof getProfileData>>>;

function getRoleMeta(role: string): { label: string; color: BadgeColor; Icon: typeof Shield } {
  switch (role) {
    case "SUPER_ADMIN":
      return { label: "Admin", color: "amber", Icon: Shield };
    case "ADMIN":
      return { label: "Trainer", color: "violet", Icon: Shield };
    default:
      return { label: "Trainee", color: "blue", Icon: GraduationCap };
  }
}

function getMemberDuration(date: Date | string): string {
  const months =
    (new Date().getFullYear() - new Date(date).getFullYear()) * 12 +
    (new Date().getMonth() - new Date(date).getMonth());
  if (months < 1) return "New";
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  return years === 1 ? "1 yr" : `${years} yr`;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function Skeleton({ className }: { className?: string }) {
  return <span className={cn("block animate-pulse rounded-[6px] bg-sunken", className)} />;
}

/* The Lifted stat: hairline-top, Spectral figure, quiet label. */
function StatCard({ value, label, loading }: { value: string | number; label: string; loading: boolean }) {
  return (
    <div className="min-w-0 border-t border-hair-strong pt-3">
      {loading ? (
        <Skeleton className="h-8 w-12" />
      ) : (
        <p className="truncate font-display text-2xl font-normal tabular-nums text-ink-900">{value}</p>
      )}
      <p className="mt-1 text-[12.5px] font-medium text-ink-500">{label}</p>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs text-ink-500">{label}</span>
      <span className={cn("text-sm font-medium text-ink-700", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}

export function ProfileDrawer({
  open,
  onClose,
  variant,
  userName,
  userEmail,
}: {
  open: boolean;
  onClose: () => void;
  variant: "admin" | "student";
  userName?: string | null;
  userEmail?: string | null;
}) {
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const skipFocusMove = useRef(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setConfirmDelete(false);
      return;
    }
    setLoading(true);
    getProfileData()
      .then((data) => setProfile(data ?? null))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [open]);

  // Lock body scroll and allow Escape to close while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handler);
    };
  }, [open, onClose]);

  // Move focus into the drawer on open, and back to the opener on close —
  // skip the very first render so mount doesn't steal page focus.
  useEffect(() => {
    if (skipFocusMove.current) {
      skipFocusMove.current = false;
      return;
    }
    if (open) {
      lastFocusedRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      closeBtnRef.current?.focus();
    } else {
      lastFocusedRef.current?.focus();
      lastFocusedRef.current = null;
    }
  }, [open]);

  if (!mounted) return null;

  const initials = getInitials(userName, userEmail);
  const role = profile?.role ?? (variant === "admin" ? "ADMIN" : "STUDENT");
  const { label: roleLabel, color: roleColor, Icon: RoleIcon } = getRoleMeta(role);

  const content = (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-[100] bg-ink-900/40 backdrop-blur-[2px] transition-opacity duration-300 reduce-transparency:backdrop-blur-none",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="My profile"
        inert={!open}
        className={cn(
          "fixed inset-y-0 right-0 z-[101] flex w-full max-w-lg flex-col overflow-hidden bg-paper transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
        style={{
          transitionTimingFunction: "var(--ease-drawer)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Header bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-hair px-5 py-4">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-900"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
            My profile
          </span>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-ink-300 transition-colors hover:bg-sunken hover:text-ink-700"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Hero ─────────────────────────────────────────────── */}
          <div className="px-6 pb-8 pt-10">
            <div className="flex flex-col items-center text-center">
              {/* Avatar: the plum sphere */}
              <div className="relative mb-5">
                <div
                  className="flex size-24 items-center justify-center rounded-full text-3xl font-semibold text-paper"
                  style={plumSphere}
                >
                  {initials}
                </div>
                <div
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full border-2 border-paper",
                    variant === "admin" ? "bg-plum-700" : "bg-plum-500"
                  )}
                >
                  <RoleIcon className="size-3 text-paper" />
                </div>
              </div>

              {loading ? (
                <Skeleton className="mb-2 h-8 w-40" />
              ) : (
                <h1 className="text-2xl font-medium text-ink-900">
                  {profile?.name ?? userName ?? "User"}
                </h1>
              )}

              {loading ? (
                <Skeleton className="mb-3 mt-1 h-4 w-52" />
              ) : (
                <p className="mb-3 mt-1 text-sm text-ink-500">{profile?.email ?? userEmail}</p>
              )}

              <Badge color={roleColor}>
                <RoleIcon className="size-3" />
                {roleLabel}
              </Badge>
            </div>
          </div>

          {/* ── Stats ───────────────────────────────────────────── */}
          <div className="px-6 pb-6">
            <div className={cn("grid gap-4", variant === "student" ? "grid-cols-3" : "grid-cols-2")}>
              {variant === "admin" ? (
                <>
                  <StatCard value={profile?._count.ownedBatches ?? 0} label="Batches" loading={loading} />
                  <StatCard
                    value={!loading && profile ? getMemberDuration(profile.createdAt) : "—"}
                    label="Member for"
                    loading={loading}
                  />
                </>
              ) : (
                <>
                  <StatCard value={profile?._count.enrollments ?? 0} label="Enrolled" loading={loading} />
                  <StatCard value={profile?._count.testAttempts ?? 0} label="Tests done" loading={loading} />
                  <StatCard
                    value={!loading && profile ? getMemberDuration(profile.createdAt) : "—"}
                    label="Member for"
                    loading={loading}
                  />
                </>
              )}
            </div>
          </div>

          {/* ── Admin: batch list ────────────────────────────────── */}
          {!loading && profile && variant === "admin" && profile.ownedBatches.length > 0 && (
            <section className="px-6 pb-6">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                Your courses
              </p>
              <div className="space-y-2">
                {profile.ownedBatches.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 rounded-[10px] border border-hair px-4 py-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-plum-100 text-plum-700">
                      <BookOpen className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-700">{b.name}</p>
                      {b.subject && <p className="text-xs text-ink-300">{b.subject}</p>}
                    </div>
                    <span className="shrink-0 rounded-[6px] border border-hair bg-paper px-2 py-0.5 font-mono text-[10px] text-ink-700">
                      {b.joinCode}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Student: enrollment list ─────────────────────────── */}
          {!loading && profile && variant === "student" && profile.enrollments.length > 0 && (
            <section className="px-6 pb-6">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                Enrolled courses
              </p>
              <div className="space-y-2">
                {profile.enrollments.map((e, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-[10px] border border-hair px-4 py-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-plum-100 text-plum-700">
                      <BookOpen className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-700">{e.batch.name}</p>
                      {e.batch.subject && <p className="text-xs text-ink-300">{e.batch.subject}</p>}
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-sage-600">
                      <CheckCircle className="size-3" />
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Account details ──────────────────────────────────── */}
          {!loading && profile && (
            <section className="px-6 pb-6">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                Account details
              </p>
              <div className="divide-y divide-hair rounded-[10px] border border-hair bg-paper">
                <InfoRow label="Joined" value={formatDate(profile.createdAt)} />
                <InfoRow label="Plan" value={profile.plan} />
                <InfoRow label="User ID" value={`#${profile.id.slice(-8).toUpperCase()}`} mono />
              </div>
            </section>
          )}

          {/* ── Danger zone ──────────────────────────────────────── */}
          <section className="px-6 pb-10">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-status-unpaid">
              Danger zone
            </p>

            {!confirmDelete ? (
              <div className="rounded-[10px] border border-status-unpaid/25 bg-status-unpaid/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[6px] bg-status-unpaid/10 text-status-unpaid">
                    <Trash2 className="size-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink-900">Delete account</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-500">
                      {variant === "admin"
                        ? "Permanently erases your account and everything you've created — all courses, trainee records, meetings, notes, tests, and conversations. Your trainees lose access immediately."
                        : "Permanently erases your account, all enrollments, test results, and your entire learning history. You'll be treated as a brand-new user next time you sign in."}
                    </p>
                    <Button variant="danger" size="sm" className="mt-3" onClick={() => setConfirmDelete(true)}>
                      <Trash2 className="size-3.5" />
                      Delete my account
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[10px] border border-status-unpaid/40 bg-status-unpaid/10 p-5">
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-status-unpaid/15">
                    <AlertTriangle className="size-4 text-status-unpaid" />
                  </div>
                  <p className="text-sm font-semibold text-status-unpaid">This cannot be undone.</p>
                </div>

                <p className="mb-3 text-sm leading-relaxed text-ink-700">
                  {variant === "admin"
                    ? "You are about to permanently destroy your account along with every course, trainee enrollment, meeting, note, test, and AI conversation tied to it. Your trainees will lose access instantly."
                    : "You are about to permanently destroy your account, all your course enrollments, test scores, and every trace of your activity in this system. The next time you sign in, you will be a complete stranger to us."}
                </p>

                <p className="mb-5 text-xs font-medium text-status-unpaid/80">
                  Your data will be wiped from the database forever.
                </p>

                <div className="flex gap-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={isPending}
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancel
                  </Button>
                  <button
                    disabled={isPending}
                    onClick={() => {
                      startTransition(async () => {
                        await deleteAccountAction();
                      });
                    }}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-status-unpaid px-4 py-1.5 text-sm font-semibold text-paper transition-colors hover:bg-status-unpaid/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? (
                      <>
                        <svg aria-hidden="true" className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Deleting…
                      </>
                    ) : (
                      <>
                        <Trash2 className="size-3.5" />
                        Yes, erase everything
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
