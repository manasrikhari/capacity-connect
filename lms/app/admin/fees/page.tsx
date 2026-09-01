import { Wallet } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { getSession } from "@/lib/session";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import {
  FEE_STATUS_BADGE,
  FEE_STATUS_LABELS,
  formatDate,
  formatPaise,
  getFeeStatus,
} from "@/lib/utils";

/** A fee is overdue when its due date has passed and money is still owed. */
function isOverdue(dueDate: Date | null, outstanding: number): boolean {
  return dueDate ? dueDate.getTime() < Date.now() && outstanding > 0 : false;
}

export default async function AdminFeesPage() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/");
  const batch = await getActiveBatch(session);
  if (!batch) redirect("/admin");

  const enrollments = await prisma.enrollment.findMany({
    where: { batchId: batch.id, status: "APPROVED" },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          fees: { where: { batchId: batch.id } },
          payments: { where: { batchId: batch.id } },
        },
      },
    },
    orderBy: { student: { name: "asc" } },
  });

  const rows = enrollments.map((e) => {
    const fee = e.student.fees[0];
    const totalAmount = fee?.totalAmount ?? 0;
    const paidAmount = e.student.payments.reduce((sum, p) => sum + p.amount, 0);
    const outstanding = Math.max(totalAmount - paidAmount, 0);
    const dueDate = fee?.dueDate ?? null;
    return {
      id: e.student.id,
      name: e.student.name ?? "Unnamed",
      email: e.student.email,
      totalAmount,
      paidAmount,
      outstanding,
      dueDate,
      overdue: isOverdue(dueDate, outstanding),
      status: getFeeStatus(totalAmount, paidAmount),
    };
  });

  const totalAssigned = rows.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalCollected = rows.reduce((sum, r) => sum + r.paidAmount, 0);
  const totalOutstanding = Math.max(totalAssigned - totalCollected, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-ink-900">Fees</h1>
        <p className="mt-1 text-sm text-ink-500">
          Track fee status and record payments per student.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatCard label="Total assigned" value={formatPaise(totalAssigned)} />
        <StatCard label="Collected" value={formatPaise(totalCollected)} color="green" />
        <StatCard label="Outstanding" value={formatPaise(totalOutstanding)} color="red" />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No approved students yet"
          description="Fee records will appear here once students are approved."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-hair-strong font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                <th className="py-2 pr-4 font-normal">Student</th>
                <th className="py-2 pr-4 font-normal">Total</th>
                <th className="py-2 pr-4 font-normal">Paid</th>
                <th className="py-2 pr-4 font-normal">Outstanding</th>
                <th className="py-2 pr-4 font-normal">Due</th>
                <th className="py-2 pr-4 font-normal">Status</th>
                <th className="py-2 pr-4 font-normal" />
              </tr>
            </thead>
            <tbody className="divide-y divide-hair">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-ink-900">{row.name}</p>
                    <p className="text-xs text-ink-500">{row.email}</p>
                  </td>
                  <td className="py-3 pr-4 font-mono tabular-nums text-ink-700">
                    {formatPaise(row.totalAmount)}
                  </td>
                  <td className="py-3 pr-4 font-mono tabular-nums text-sage-700">
                    {formatPaise(row.paidAmount)}
                  </td>
                  <td className="py-3 pr-4 font-mono tabular-nums text-ink-900">
                    {formatPaise(row.outstanding)}
                  </td>
                  <td className="py-3 pr-4">
                    {row.dueDate ? (
                      <span
                        className={`font-mono text-xs ${
                          row.overdue ? "text-status-unpaid" : "text-ink-500"
                        }`}
                      >
                        Due {formatDate(row.dueDate)}
                      </span>
                    ) : (
                      <span className="text-ink-300">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge color={FEE_STATUS_BADGE[row.status]}>
                        {FEE_STATUS_LABELS[row.status]}
                      </Badge>
                      {row.overdue ? <Badge color="red">Overdue</Badge> : null}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <Link
                      href={`/admin/fees/${row.id}`}
                      className={buttonClasses("secondary", "sm")}
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
