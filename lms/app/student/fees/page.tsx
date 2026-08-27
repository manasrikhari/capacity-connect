import { Receipt } from "lucide-react";
import { redirect } from "next/navigation";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getSession } from "@/lib/session";
import { getActiveStudentBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPaise, getFeeStatus } from "@/lib/utils";

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

export default async function StudentFeesPage() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");
  const batch = await getActiveStudentBatch(session);
  if (!batch) redirect("/student");

  const studentId = session.user.id;

  const [fee, payments] = await Promise.all([
    prisma.fee.findUnique({
      where: { studentId_batchId: { studentId, batchId: batch.id } },
    }),
    prisma.payment.findMany({
      where: { studentId, batchId: batch.id },
      orderBy: { date: "desc" },
    }),
  ]);

  const totalAmount = fee?.totalAmount ?? 0;
  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const status = getFeeStatus(totalAmount, paidAmount);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Fees</h1>
        <p className="mt-1 text-sm text-slate-500">Your fee status and payment history.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fee summary</CardTitle>
          <Badge color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>
        </CardHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-slate-500">Total fee</p>
            <p className="mt-1 text-xl font-semibold text-slate-800">{formatPaise(totalAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Paid</p>
            <p className="mt-1 text-xl font-semibold text-emerald-600">{formatPaise(paidAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Outstanding</p>
            <p className="mt-1 text-xl font-semibold text-amber-600">
              {formatPaise(Math.max(totalAmount - paidAmount, 0))}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
        </CardHeader>
        {payments.length === 0 ? (
          <EmptyState icon={Receipt} title="No payments recorded yet" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {payments.map((payment) => (
              <li key={payment.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {formatPaise(payment.amount)} &middot; {payment.method}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDate(payment.date)}
                    {payment.note ? ` · ${payment.note}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
