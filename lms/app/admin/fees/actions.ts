"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { feeAmountSchema, paymentSchema } from "@/lib/validations/fee";
import { rupeesToPaise } from "@/lib/utils";

export async function setFeeAmount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active batch" };

  const parsed = feeAmountSchema.safeParse({
    studentId: formData.get("studentId"),
    totalAmount: formData.get("totalAmount"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_batchId: { studentId: parsed.data.studentId, batchId: batch.id } },
  });
  if (!enrollment || enrollment.status !== "APPROVED") {
    return { error: "Student not enrolled in this batch" };
  }

  const totalAmount = rupeesToPaise(parsed.data.totalAmount);

  await prisma.fee.upsert({
    where: { studentId_batchId: { studentId: parsed.data.studentId, batchId: batch.id } },
    update: { totalAmount },
    create: { studentId: parsed.data.studentId, batchId: batch.id, totalAmount },
  });

  revalidatePath("/admin/fees");
  revalidatePath(`/admin/fees/${parsed.data.studentId}`);
  revalidatePath("/student/fees");
  return { success: true };
}

export async function recordPayment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active batch" };

  const parsed = paymentSchema.safeParse({
    studentId: formData.get("studentId"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    method: formData.get("method"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_batchId: { studentId: parsed.data.studentId, batchId: batch.id } },
  });
  if (!enrollment || enrollment.status !== "APPROVED") {
    return { error: "Student not enrolled in this batch" };
  }

  const date = new Date(parsed.data.date);
  if (Number.isNaN(date.getTime())) {
    return { fieldErrors: { date: ["Enter a valid date"] } };
  }

  await prisma.payment.create({
    data: {
      studentId: parsed.data.studentId,
      batchId: batch.id,
      amount: rupeesToPaise(parsed.data.amount),
      date,
      method: parsed.data.method,
      note: parsed.data.note || null,
    },
  });

  revalidatePath("/admin/fees");
  revalidatePath(`/admin/fees/${parsed.data.studentId}`);
  revalidatePath("/student/fees");
  return { success: true };
}

export async function deletePayment(id: string) {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active batch" };

  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment || payment.batchId !== batch.id) return { error: "Payment not found" };

  await prisma.payment.delete({ where: { id } });

  revalidatePath("/admin/fees");
  revalidatePath(`/admin/fees/${payment.studentId}`);
  revalidatePath("/student/fees");
  return { success: true as const };
}
