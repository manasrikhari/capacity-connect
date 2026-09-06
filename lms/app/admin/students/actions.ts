"use server";

import { revalidatePath } from "next/cache";
import { getActiveBatch } from "@/lib/batch";
import { notify } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { triggerEnrollmentUpdated } from "@/lib/pusher-server";

export async function updateEnrollmentStatus(input: {
  enrollmentId: string;
  status: "APPROVED" | "REJECTED";
}) {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active batch" };

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: input.enrollmentId },
    include: { batch: true },
  });

  if (!enrollment) return { error: "Enrollment not found" };
  if (enrollment.batch.teacherId !== session.user.id) {
    return { error: "You do not own this batch" };
  }

  await prisma.enrollment.update({
    where: { id: input.enrollmentId },
    data: { status: input.status },
  });

  await triggerEnrollmentUpdated({
    enrollmentId: enrollment.id,
    studentId: enrollment.studentId,
    batchId: enrollment.batchId,
    batchName: enrollment.batch.name,
    status: input.status,
  });

  await notify({
    userId: enrollment.studentId,
    kind: `enrollment.${input.status.toLowerCase()}`,
    title:
      input.status === "APPROVED"
        ? `Enrolment approved: ${enrollment.batch.name}`
        : `Enrolment not approved: ${enrollment.batch.name}`,
    body:
      input.status === "APPROVED"
        ? "You now have access to the course materials and assessments."
        : "Your enrolment request was declined. You can request again or contact the trainer.",
    href: "/student",
  });

  revalidatePath("/admin/students");
  revalidatePath("/admin/dashboard");
  return { success: true as const };
}

export async function deleteStudent(studentId: string) {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active batch" };

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_batchId: { studentId, batchId: batch.id } },
    include: { batch: true },
  });

  if (!enrollment) return { error: "Enrollment not found" };
  if (enrollment.batch.teacherId !== session.user.id) {
    return { error: "You do not own this batch" };
  }

  await prisma.enrollment.delete({ where: { id: enrollment.id } });

  revalidatePath("/admin/students");
  return { success: true as const };
}
