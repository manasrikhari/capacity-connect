import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FeeDetailManager } from "@/components/admin/FeeDetailManager";
import { getSession } from "@/lib/session";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";

/** A fee is overdue when its due date has passed and money is still owed. */
function isOverdue(dueDate: Date | null, outstanding: number): boolean {
  return dueDate ? dueDate.getTime() < Date.now() && outstanding > 0 : false;
}

export default async function AdminFeeDetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/");
  const batch = await getActiveBatch(session);
  if (!batch) redirect("/admin");

  const { studentId } = await params;

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_batchId: { studentId, batchId: batch.id } },
    include: { student: { select: { id: true, name: true, email: true } } },
  });

  if (!enrollment || enrollment.status !== "APPROVED") notFound();

  const [fee, payments] = await Promise.all([
    prisma.fee.findUnique({
      where: { studentId_batchId: { studentId, batchId: batch.id } },
    }),
    prisma.payment.findMany({
      where: { studentId, batchId: batch.id },
      orderBy: { date: "desc" },
    }),
  ]);

  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const outstanding = Math.max((fee?.totalAmount ?? 0) - paidAmount, 0);
  const overdue = isOverdue(fee?.dueDate ?? null, outstanding);

  return (
    <div className="space-y-6">
      <Link href="/admin/fees" className="inline-flex items-center gap-1 text-sm text-plum-700 hover:underline">
        <ArrowLeft className="size-4" /> Back to fees
      </Link>
      <FeeDetailManager
        overdue={overdue}
        student={{
          id: enrollment.student.id,
          name: enrollment.student.name,
          email: enrollment.student.email,
          fee,
          payments,
        }}
      />
    </div>
  );
}
