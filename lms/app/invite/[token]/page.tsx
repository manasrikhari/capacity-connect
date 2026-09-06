import { CheckCircle2, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { acceptInviteFormAction, inviteGoogleSignInAction } from "@/app/invite/actions";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Card } from "@/components/ui/Card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Your invitation — Capacity Connect",
};

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;

  const invite = await prisma.invite.findUnique({
    where: { token },
    select: {
      email: true,
      name: true,
      cadre: true,
      designation: true,
      expiresAt: true,
      acceptedAt: true,
      batch: { select: { name: true, slug: true, id: true, wmoTier: true } },
      department: { select: { name: true } },
      invitedBy: { select: { name: true } },
    },
  });

  const session = await auth();

  const problem = !invite
    ? "This invitation link is not valid."
    : invite.acceptedAt
      ? "This invitation has already been used."
      : invite.expiresAt < new Date()
        ? "This invitation has expired. Ask your training coordinator to send a new one."
        : null;

  // Accepting is a mutation, so it never happens on a GET — a link preview or a
  // prefetch would silently consume the invitation. The matching signed-in user
  // gets an explicit button instead.
  const canAccept =
    Boolean(invite) &&
    !problem &&
    session?.user?.email?.toLowerCase() === invite?.email.toLowerCase();

  return (
    <>
      <PublicHeader />
      <main className="flex-1 bg-page">
        <div className="mx-auto max-w-lg px-4 py-16 md:px-6">
          <Card className="space-y-4">
            {problem ? (
              <>
                <p className="flex items-center gap-2 font-display text-xl font-normal text-ink-900">
                  <XCircle className="size-5 text-status-unpaid" />
                  Invitation unavailable
                </p>
                <p className="text-sm text-ink-500">{problem}</p>
                <Link href="/courses" className="inline-block text-sm text-plum-600 hover:underline">
                  Browse courses instead →
                </Link>
              </>
            ) : (
              invite && (
                <>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-300">
                    {invite.department?.name ?? "Ministry of Earth Sciences"}
                  </p>
                  <h1 className="font-display text-2xl font-normal leading-snug text-ink-900">
                    {invite.name ? `${invite.name}, you have` : "You have"} been nominated
                    {invite.batch ? ` for ${invite.batch.name}` : ""}
                  </h1>
                  <p className="text-sm text-ink-500">
                    {invite.invitedBy?.name
                      ? `${invite.invitedBy.name} nominated you on behalf of your office.`
                      : "Your office nominated you."}{" "}
                    Accepting enrols you straight away — there is no approval to wait for.
                  </p>

                  <dl className="space-y-2 rounded-xl bg-sunken px-4 py-3 text-sm">
                    <Row label="Invitation sent to">{invite.email}</Row>
                    {invite.cadre && <Row label="Cadre">{invite.cadre}</Row>}
                    {invite.designation && <Row label="Designation">{invite.designation}</Row>}
                  </dl>

                  {error === "wrong-account" && (
                    <p className="rounded-xl bg-sunken px-3 py-2 text-sm text-status-unpaid">
                      You signed in with a different account. This invitation is for {invite.email}.
                    </p>
                  )}

                  {canAccept ? (
                    <form action={acceptInviteFormAction}>
                      <input type="hidden" name="token" value={token} />
                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-plum-600 px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-plum-700"
                      >
                        <CheckCircle2 className="size-4" />
                        Accept invitation
                      </button>
                    </form>
                  ) : session?.user ? (
                    <p className="rounded-xl bg-sunken px-3 py-2.5 text-sm text-ink-500">
                      You are signed in as {session.user.email}. Sign out and sign in as{" "}
                      {invite.email} to accept this invitation.
                    </p>
                  ) : (
                    <form action={inviteGoogleSignInAction}>
                      <input type="hidden" name="token" value={token} />
                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-plum-600 px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-plum-700"
                      >
                        <CheckCircle2 className="size-4" />
                        Accept and sign in
                      </button>
                    </form>
                  )}

                  <p className="text-center text-xs text-ink-300">
                    Sign in with {invite.email}.
                  </p>
                </>
              )
            )}
          </Card>
        </div>
      </main>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-500">{label}</dt>
      <dd className="text-right text-ink-900">{children}</dd>
    </div>
  );
}
