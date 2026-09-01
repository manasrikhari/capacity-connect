import { Wallet } from "lucide-react";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/utils";

export default async function FeesOverviewPage() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const batches = await prisma.batch.findMany({
    where: { teacherId: session.user.id, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      grade: true,
      enrollments: { where: { status: "APPROVED" }, select: { id: true } },
      fees: { select: { totalAmount: true } },
      payments: { select: { amount: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const rows = batches.map((b) => {
    const assigned = b.fees.reduce((sum, f) => sum + f.totalAmount, 0);
    const collected = b.payments.reduce((sum, p) => sum + p.amount, 0);
    const outstanding = Math.max(assigned - collected, 0);
    const percent = assigned > 0 ? Math.round((collected / assigned) * 100) : 0;
    return {
      id: b.id,
      name: b.name,
      grade: b.grade,
      students: b.enrollments.length,
      assigned,
      collected,
      outstanding,
      percent,
    };
  });

  const totalAssigned = rows.reduce((sum, r) => sum + r.assigned, 0);
  const totalCollected = rows.reduce((sum, r) => sum + r.collected, 0);
  const totalOutstanding = Math.max(totalAssigned - totalCollected, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-ink-900">Fees overview</h1>
        <p className="mt-1 text-sm text-ink-500">
          Collection across all your active batches.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No active batches yet"
          description="Once you have an active batch with fees, the collection summary shows here."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <StatCard label="Total assigned" value={formatPaise(totalAssigned)} />
            <StatCard label="Collected" value={formatPaise(totalCollected)} color="green" />
            <StatCard label="Outstanding" value={formatPaise(totalOutstanding)} color="red" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-hair-strong font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                  <th className="py-2 pr-4 font-normal">Batch</th>
                  <th className="py-2 pr-4 font-normal">Students</th>
                  <th className="py-2 pr-4 font-normal">Collected</th>
                  <th className="py-2 pr-4 font-normal">Outstanding</th>
                  <th className="py-2 pr-4 font-normal">Collected %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hair">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-ink-900">{row.name}</p>
                      {row.grade ? <p className="text-xs text-ink-500">{row.grade}</p> : null}
                    </td>
                    <td className="py-3 pr-4 font-mono tabular-nums text-ink-700">{row.students}</td>
                    <td className="py-3 pr-4 font-mono tabular-nums text-sage-700">
                      {formatPaise(row.collected)}
                    </td>
                    <td className="py-3 pr-4 font-mono tabular-nums text-ink-900">
                      {formatPaise(row.outstanding)}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-sunken"
                          aria-hidden="true"
                        >
                          <div
                            className="h-full rounded-full bg-sage-600"
                            style={{ width: `${Math.min(row.percent, 100)}%` }}
                          />
                        </div>
                        <span className="font-mono tabular-nums text-ink-700">{row.percent}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
