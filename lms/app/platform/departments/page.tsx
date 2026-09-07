import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { auth } from "@/lib/auth";
import { getDepartmentOverview } from "@/lib/national-db";

const TABLE_HEAD = "font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300";

export default async function DepartmentsPage() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/");

  const departments = await getDepartmentOverview();
  const totals = departments.reduce(
    (acc, d) => ({
      sent: acc.sent + d.invitesSent,
      accepted: acc.accepted + d.invitesAccepted,
      certified: acc.certified + d.certified,
    }),
    { sent: 0, accepted: 0, certified: 0 },
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-normal text-ink-900">Offices &amp; nominations</h1>
          <p className="mt-1 text-sm text-ink-500">
            The national picture of the nomination programme — {departments.length} offices, {totals.accepted}{" "}
            of {totals.sent} nominations accepted, {totals.certified} certified.
          </p>
        </div>
        <Link href="/platform" className="text-sm text-plum-600 hover:underline">
          ← Back to dashboard
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Building2 className="size-5 text-ink-300" />
              By office
            </span>
          </CardTitle>
        </CardHeader>
        {departments.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No offices registered yet"
            description="Departments with a SPOC appear here as they nominate staff onto courses."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className={`border-b border-hair-strong ${TABLE_HEAD}`}>
                  <th className="py-2 pr-4 font-normal">Office</th>
                  <th className="py-2 pr-4 font-normal">SPOC</th>
                  <th className="py-2 pr-4 text-right font-normal">Nominated</th>
                  <th className="py-2 pr-4 text-right font-normal">Accepted</th>
                  <th className="py-2 pr-4 text-right font-normal">Cohort</th>
                  <th className="py-2 pr-4 text-right font-normal">Enrolled</th>
                  <th className="py-2 text-right font-normal">Certified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hair">
                {departments.map((d) => (
                  <tr key={d.id}>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-ink-900">{d.name}</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300">
                        {[d.kind, d.code].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </td>
                    <td className="py-3 pr-4 text-ink-700">
                      {d.spocName ?? <span className="text-ink-300">Unassigned</span>}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono tabular-nums text-ink-900">{d.invitesSent}</td>
                    <td className="py-3 pr-4 text-right font-mono tabular-nums text-ink-900">
                      {d.invitesAccepted}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono tabular-nums text-ink-900">{d.cohortSize}</td>
                    <td className="py-3 pr-4 text-right font-mono tabular-nums text-ink-900">
                      {d.activeEnrollments}
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums text-ink-900">{d.certified}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
