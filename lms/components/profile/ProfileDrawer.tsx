"use client";

import { createPortal } from "react-dom";
import { useEffect, useState, useTransition } from "react";
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
import { Button } from "@/components/ui/Button";

type ProfileData = NonNullable<Awaited<ReturnType<typeof getProfileData>>>;

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "?";
}

function getRoleMeta(role: string) {
  switch (role) {
    case "SUPER_ADMIN":
      return { label: "Super Admin", colorClass: "bg-amber-100 text-amber-700 border-amber-200", Icon: Shield };
    case "ADMIN":
      return { label: "Administrator", colorClass: "bg-violet-100 text-violet-700 border-violet-200", Icon: Shield };
    default:
      return { label: "Student", colorClass: "bg-blue-100 text-blue-700 border-blue-200", Icon: GraduationCap };
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
  return <span className={cn("block animate-pulse rounded-lg bg-slate-200", className)} />;
}

function StatCard({ value, label, loading }: { value: string | number; label: string; loading: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-100 bg-white px-3 py-4 text-center shadow-sm">
      {loading ? (
        <Skeleton className="h-7 w-10" />
      ) : (
        <span className="text-xl font-bold text-slate-800">{value}</span>
      )}
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</span>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={cn("text-sm font-medium text-slate-700", mono && "font-mono text-xs")}>{value}</span>
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

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!mounted) return null;

  const initials = getInitials(userName, userEmail);
  const role = profile?.role ?? (variant === "admin" ? "ADMIN" : "STUDENT");
  const { label: roleLabel, colorClass, Icon: RoleIcon } = getRoleMeta(role);

  const content = (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-[2px] transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-[101] flex w-full max-w-lg flex-col overflow-hidden bg-white shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
        style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
      >
        {/* Header bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-700"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">My Profile</span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Hero ─────────────────────────────────────────────── */}
          <div className="relative overflow-hidden px-6 pb-8 pt-10">
            <div className="pointer-events-none absolute -left-12 -top-12 size-56 rounded-full bg-violet-200/25 blur-3xl" />
            <div className="pointer-events-none absolute -top-8 right-0 size-44 rounded-full bg-purple-200/20 blur-3xl" />

            <div className="relative flex flex-col items-center text-center">
              {/* Avatar with glow */}
              <div className="relative mb-5">
                <div className="absolute inset-0 scale-110 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 opacity-30 blur-md" />
                <div className="relative flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 via-violet-500 to-purple-500 text-3xl font-extrabold text-white shadow-lg shadow-violet-300/40">
                  {initials}
                </div>
                <div
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full border-2 border-white",
                    variant === "admin" ? "bg-violet-500" : "bg-blue-500"
                  )}
                >
                  <RoleIcon className="size-3 text-white" />
                </div>
              </div>

              {loading ? (
                <Skeleton className="mb-2 h-8 w-40" />
              ) : (
                <h1 className="text-2xl font-extrabold text-slate-800">
                  {profile?.name ?? userName ?? "User"}
                </h1>
              )}

              {loading ? (
                <Skeleton className="mb-3 mt-1 h-4 w-52" />
              ) : (
                <p className="mb-3 mt-1 text-sm text-slate-400">{profile?.email ?? userEmail}</p>
              )}

              <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", colorClass)}>
                <RoleIcon className="size-3" />
                {roleLabel}
              </span>
            </div>
          </div>

          {/* ── Stats ───────────────────────────────────────────── */}
          <div className="px-6 pb-6">
            <div className={cn("grid gap-3", variant === "student" ? "grid-cols-3" : "grid-cols-2")}>
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
              <p className="mb-3 text-[10.5px] font-bold uppercase tracking-widest text-slate-400">Your Batches</p>
              <div className="space-y-2">
                {profile.ownedBatches.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/50 px-4 py-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                      <BookOpen className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-700">{b.name}</p>
                      {b.subject && <p className="text-xs text-slate-400">{b.subject}</p>}
                    </div>
                    <span className="shrink-0 rounded-full border border-violet-100 bg-white px-2 py-0.5 font-mono text-[10px] font-medium text-violet-600">
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
              <p className="mb-3 text-[10.5px] font-bold uppercase tracking-widest text-slate-400">Enrolled Courses</p>
              <div className="space-y-2">
                {profile.enrollments.map((e, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/40 px-4 py-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <BookOpen className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-700">{e.batch.name}</p>
                      {e.batch.subject && <p className="text-xs text-slate-400">{e.batch.subject}</p>}
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-emerald-600">
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
              <p className="mb-3 text-[10.5px] font-bold uppercase tracking-widest text-slate-400">Account Details</p>
              <div className="divide-y divide-slate-50 rounded-xl border border-slate-100 bg-white">
                <InfoRow label="Joined" value={formatDate(profile.createdAt)} />
                <InfoRow label="Plan" value={profile.plan} />
                <InfoRow label="User ID" value={`#${profile.id.slice(-8).toUpperCase()}`} mono />
              </div>
            </section>
          )}

          {/* ── Danger zone ──────────────────────────────────────── */}
          <section className="px-6 pb-10">
            <p className="mb-3 text-[10.5px] font-bold uppercase tracking-widest text-red-400">Danger Zone</p>

            {!confirmDelete ? (
              <div className="rounded-xl border border-red-100 bg-red-50/60 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-500">
                    <Trash2 className="size-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">Delete account</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      {variant === "admin"
                        ? "Permanently erases your account and everything you've created — all batches, student records, meetings, notes, tests, and conversations. Your students lose access immediately."
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
              <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-rose-50 p-5">
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-100">
                    <AlertTriangle className="size-4 text-red-600" />
                  </div>
                  <p className="text-sm font-bold text-red-700">This cannot be undone.</p>
                </div>

                <p className="mb-3 text-sm leading-relaxed text-red-700">
                  {variant === "admin"
                    ? "You are about to permanently destroy your account along with every batch, student enrollment, meeting, note, test, fee record, and AI conversation tied to it. Your students will lose access instantly."
                    : "You are about to permanently destroy your account, all your course enrollments, test scores, and every trace of your activity in this system. The next time you sign in, you will be a complete stranger to us."}
                </p>

                <p className="mb-5 text-xs font-medium text-red-400">
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
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-600 bg-red-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm shadow-red-200 transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? (
                      <>
                        <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
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
