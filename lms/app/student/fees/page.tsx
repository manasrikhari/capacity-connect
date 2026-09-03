import { Receipt } from "lucide-react";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getSession } from "@/lib/session";
import { getActiveStudentBatch } from "@/lib/batch";
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
  const outstanding = Math.max(totalAmount - paidAmount, 0);
  const hasFee = totalAmount > 0;
  const status = getFeeStatus(totalAmount, paidAmount);
  const dueDate = fee?.dueDate ?? null;
  const overdue = hasFee && isOverdue(dueDate, outstanding);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-ink-900">Fees</h1>
        <p className="mt-1 text-sm text-ink-500">Your fee status and payment history.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fee summary</CardTitle>
          {hasFee ? (
            <div className="flex items-center gap-1.5">
              <Badge color={FEE_STATUS_BADGE[status]}>{FEE_STATUS_LABELS[status]}</Badge>
              {overdue ? <Badge color="red">Overdue</Badge> : null}
            </div>
          ) : (
            <Badge color="slate">No fee assigned</Badge>
          )}
        </CardHeader>
        {hasFee ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-ink-500">Total fee</p>
                <p className="mt-1 font-display text-2xl tabular-nums text-ink-900">
                  {formatPaise(totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-ink-500">Paid</p>
                <p className="mt-1 font-display text-2xl tabular-nums text-sage-700">
                  {formatPaise(paidAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-ink-500">Outstanding</p>
                <p
                  className={`mt-1 font-display text-2xl tabular-nums ${
                    outstanding > 0 ? "text-status-unpaid" : "text-ink-900"
                  }`}
                >
                  {formatPaise(outstanding)}
                </p>
              </div>
            </div>
            {dueDate ? (
              <p
                className={`mt-4 font-mono text-xs ${
                  overdue ? "text-status-unpaid" : "text-ink-500"
                }`}
              >
                {overdue ? `Overdue · was due ${formatDate(dueDate)}` : `Due ${formatDate(dueDate)}`}
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-ink-500">
            No fee assigned yet. Your tutor will set it when it&apos;s ready.
          </p>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
        </CardHeader>
        {payments.length === 0 ? (
          <EmptyState icon={Receipt} title="No payments recorded yet" />
        ) : (
          <ul className="divide-y divide-hair">
            {payments.map((payment) => (
              <li key={payment.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-ink-900">
                    {formatPaise(payment.amount)} &middot; {payment.method}
                  </p>
                  <p className="font-mono text-xs text-ink-500">
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
