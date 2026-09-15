import { Building2, Clock, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { NominateForm } from "@/components/spoc/NominateForm";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { prisma } from "@/lib/prisma";
import { getSpocContext, getSpocDashboard } from "@/lib/spoc";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Training coordinator — Capacity Connect",
};

export default async function SpocPage() {
  const ctx = await getSpocContext();
  if (!ctx) redirect("/");

  const { courses, pendingInvites, cohort } = await getSpocDashboard(ctx);

  return (
    <>
      <PublicHeader
        right={
          <Link href="/courses" className="text-sm text-plum-700 hover:underline">
            Browse courses
          </Link>
        }
      />

      <main id="main-content" tabIndex={-1} className="flex-1 bg-page">
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 md:px-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-300">
              Training coordinator
            </p>
            <h1 className="mt-2 font-display text-3xl font-normal text-ink-900">
              {ctx.departments.map((d) => d.name).join(", ")}
            </h1>
            <p className="mt-2 max-w-2xl text-ink-500">
              Nominate your office&apos;s staff onto a course and track them as a cohort. Nominated staff
              skip the join code and the approval queue — your office vouching for them is the approval.
            </p>
          </div>

          <NominateForm departments={ctx.departments} courses={courses} />

          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Clock className="size-5 text-ink-300" />
                  Awaiting acceptance
                </span>
              </CardTitle>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                {pendingInvites.length}
              </span>
            </CardHeader>
            {pendingInvites.length === 0 ? (
              <p className="text-sm text-ink-500">Every invitation you have sent has been accepted.</p>
            ) : (
              <ul className="divide-y divide-hair">
                {pendingInvites.map((i) => {
                  return (
                    <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-ink-900">{i.name ?? i.email}</p>
                        <p className="truncate font-mono text-[11px] text-ink-300">
                          {i.name ? `${i.email} · ` : ""}
                          {i.batch?.name ?? "No course"} · sent {formatDate(i.createdAt)}
                        </p>
                      </div>
                      <Badge color={i.expired ? "red" : "amber"}>
                        {i.expired ? "Expired" : `Expires ${formatDate(i.expiresAt)}`}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Users className="size-5 text-ink-300" />
                  Your cohort
                </span>
              </CardTitle>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                {cohort.length}
              </span>
            </CardHeader>
            {cohort.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="Nobody from your office yet"
                description="Nominate staff above and they will appear here once they accept."
              />
            ) : (
              <ul className="divide-y divide-hair">
                {cohort.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-900">{p.name ?? p.email}</p>
                      <p className="truncate text-xs text-ink-500">
                        {[p.profile?.designation, p.profile?.cadre].filter(Boolean).join(" · ") ||
                          p.email}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs text-ink-500">
                      <span>
                        {p.enrollments.length} course{p.enrollments.length === 1 ? "" : "s"}
                      </span>
                      <span className="font-mono tabular-nums">
                        {p._count.certificates} certified
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </main>
    </>
  );
}
