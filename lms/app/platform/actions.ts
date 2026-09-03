"use server";

import { revalidatePath } from "next/cache";
import type { ApprovalStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/session";

export async function updateTeacherStatus(input: {
  teacherId: string;
  status: Extract<ApprovalStatus, "APPROVED" | "REJECTED" | "SUSPENDED">;
}) {
  await requireSuperAdmin();

  const teacher = await prisma.user.findUnique({
    where: { id: input.teacherId },
  });

  if (!teacher || teacher.role !== "ADMIN") {
    return { error: "Teacher not found" };
  }

  await prisma.user.update({
    where: { id: input.teacherId },
    data: { status: input.status },
  });

  revalidatePath("/platform");
  return { success: true as const };
}

/**
 * Reassign a course to a trainer. Reassigns Batch.teacherId (the previous owner
 * loses the course in /admin); a trainer↔course join table is the long-term
 * shape but would touch every teacherId check across the app.
 */
export async function assignTrainerToBatch(
  batchId: string,
  trainerId: string,
): Promise<{ error?: string }> {
  await requireSuperAdmin();
  const trainer = await prisma.user.findUnique({ where: { id: trainerId } });
  if (!trainer || trainer.role !== "ADMIN" || trainer.status !== "APPROVED") {
    return { error: "Trainer not found or not approved" };
  }
  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch) return { error: "Course not found" };

  await prisma.batch.update({ where: { id: batchId }, data: { teacherId: trainerId } });
  revalidatePath("/platform/competency");
  return {};
}

/** Toggle the verified flag on a trainer's declared skill. */
export async function verifyTrainerSkillAction(
  trainerSkillId: string,
  isVerified: boolean,
): Promise<{ error?: string }> {
  await requireSuperAdmin();
  await prisma.trainerSkill.update({
    where: { id: trainerSkillId },
    data: { isVerified },
  });
  revalidatePath("/platform/competency");
  return {};
}
