import { Clock, ShieldOff, ShieldX } from "lucide-react";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Card } from "@/components/ui/Card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

type State = {
  tone: "pending" | "rejected" | "suspended";
  icon: typeof ShieldX;
  title: string;
  body: string;
};

const STATES: Record<"PENDING" | "REJECTED" | "SUSPENDED", State> = {
  PENDING: {
    tone: "pending",
    icon: Clock,
    title: "Account pending approval",
    body: "Your trainer account is awaiting approval from a Ministry of Earth Sciences administrator. You'll be able to sign in fully once approved — this usually takes a day or two.",
  },
  REJECTED: {
    tone: "rejected",
    icon: ShieldX,
    title: "Request not approved",
    body: "Your trainer request was not approved. If you believe this was a mistake, contact a Ministry of Earth Sciences administrator.",
  },
  SUSPENDED: {
    tone: "suspended",
    icon: ShieldOff,
    title: "Account suspended",
    body: "Your account has been suspended. Please contact a platform administrator to restore access.",
  },
};

export default async function BlockedPage() {
  const session = await auth();
  if (!session) redirect("/");

  // An APPROVED user has no business here — send them to their dashboard.
  if (session.user.status === "APPROVED") {
    redirect(session.user.role === "STUDENT" ? "/student" : "/admin");
  }

  const status = (session.user.status ?? "PENDING") as keyof typeof STATES;
  const state = STATES[status] ?? STATES.PENDING;
  const Icon = state.icon;

  // Surface what a pending trainer submitted, when there's a request on file.
  const request =
    state.tone === "pending"
      ? await prisma.trainerRequest.findUnique({
          where: { userId: session.user.id },
          select: { organisation: true, designation: true, intent: true, createdAt: true },
        })
      : null;

  const toneClasses =
    state.tone === "pending"
      ? "bg-status-partial/15 text-status-partial"
      : "bg-status-unpaid/12 text-status-unpaid";

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <div className={`mx-auto mb-4 flex size-14 items-center justify-center rounded-full ${toneClasses}`}>
          <Icon className="size-7" />
        </div>
        <h1 className="text-xl font-medium text-ink-900">{state.title}</h1>
        <p className="mt-2 text-sm text-ink-500">{state.body}</p>

        {request ? (
          <div className="mt-5 rounded-xl border border-hair bg-paper p-4 text-left">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
              Your request · {formatDate(request.createdAt)}
            </p>
            <dl className="mt-2 space-y-1 text-sm">
              {request.organisation ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-500">Organisation</dt>
                  <dd className="text-ink-900">{request.organisation}</dd>
                </div>
              ) : null}
              {request.designation ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-500">Designation</dt>
                  <dd className="text-ink-900">{request.designation}</dd>
                </div>
              ) : null}
            </dl>
            {request.intent ? (
              <p className="mt-2 text-xs text-ink-500">&ldquo;{request.intent}&rdquo;</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 flex justify-center">
          <SignOutButton />
        </div>
      </Card>
    </main>
  );
}
