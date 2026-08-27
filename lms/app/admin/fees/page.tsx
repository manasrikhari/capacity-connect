import { Wallet } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getSession } from "@/lib/session";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { formatPaise, getFeeStatus } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  PAID: "Paid",
  PARTIAL: "Partially paid",
  UNPAID: "Unpaid",
};

const STATUS_COLORS: Record<string, BadgeColor> = {
  PAID: "green",
  PARTIAL: "amber",
  UNPAID: "red",
};

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
    return {
      id: e.student.id,
      name: e.student.name ?? "Unnamed",
      email: e.student.email,
      totalAmount,
      paidAmount,
      status: getFeeStatus(totalAmount, paidAmount),
    };
  });

  const totalDue = rows.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalCollected = rows.reduce((sum, r) => sum + r.paidAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Fees</h1>
        <p className="mt-1 text-sm text-slate-500">Track fee status and record payments per student.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Total due</p>
          <p className="mt-1 text-xl font-semibold text-slate-800">{formatPaise(totalDue)}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Total collected</p>
          <p className="mt-1 text-xl font-semibold text-emerald-600">{formatPaise(totalCollected)}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Outstanding</p>
          <p className="mt-1 text-xl font-semibold text-amber-600">
            {formatPaise(Math.max(totalDue - totalCollected, 0))}
          </p>
        </Card>
      </div>

      <Card>
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
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-4">Student</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Paid</th>
                  <th className="py-2 pr-4">Outstanding</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2 pr-4">
                      <p className="font-medium text-slate-800">{row.name}</p>
                      <p className="text-xs text-slate-500">{row.email}</p>
                    </td>
                    <td className="py-2 pr-4 text-slate-700">{formatPaise(row.totalAmount)}</td>
                    <td className="py-2 pr-4 text-slate-700">{formatPaise(row.paidAmount)}</td>
                    <td className="py-2 pr-4 text-slate-700">
                      {formatPaise(Math.max(row.totalAmount - row.paidAmount, 0))}
                    </td>
                    <td className="py-2 pr-4">
                      <Badge color={STATUS_COLORS[row.status]}>{STATUS_LABELS[row.status]}</Badge>
                    </td>
                    <td className="py-2 pr-4">
                      <Link href={`/admin/fees/${row.id}`} className={buttonClasses("secondary", "sm")}>
                        Manage
                      </Link>
                    </td>
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
