"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { setActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";

export async function setActiveBatchAction(batchId: string) {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") {
    throw new Error("Unauthorized");
  }
  await setActiveBatch(session, batchId);
  redirect("/student/dashboard");
}

export async function cancelEnrollmentAction(enrollmentId: string) {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") {
    throw new Error("Unauthorized");
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
  });

  if (!enrollment || enrollment.studentId !== session.user.id) {
    throw new Error("Enrollment not found");
  }
  if (enrollment.status !== "PENDING") {
    throw new Error("Only pending requests can be cancelled");
  }

  await prisma.enrollment.delete({ where: { id: enrollmentId } });
  revalidatePath("/student");
}
