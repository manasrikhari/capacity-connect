"use server";

import { revalidatePath } from "next/cache";
import type { ApprovalStatus, Role } from "@/app/generated/prisma/enums";
import { notify } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/session";

/** Append an immutable audit row. Best-effort: never blocks the primary write. */
async function audit(input: {
  actorId?: string;
  targetId?: string;
  action: string;
  fromValue?: string | null;
  toValue?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        targetId: input.targetId ?? null,
        action: input.action,
        fromValue: input.fromValue ?? null,
        toValue: input.toValue ?? null,
        metadata: input.metadata ? (input.metadata as object) : undefined,
      },
    });
  } catch (err) {
    console.warn("[audit] failed to record", input.action, err);
  }
}

export async function updateTeacherStatus(input: {
  teacherId: string;
  status: Extract<ApprovalStatus, "APPROVED" | "REJECTED" | "SUSPENDED">;
}) {
  const session = await requireSuperAdmin();

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

  await audit({
    actorId: session.user.id,
    targetId: input.teacherId,
    action: "status.change",
    fromValue: teacher.status,
    toValue: input.status,
  });

  const STATUS_MSG: Record<string, { title: string; body: string }> = {
    APPROVED: { title: "Your trainer account is approved", body: "You can now build courses and assessments." },
    REJECTED: { title: "Your trainer account was not approved", body: "Contact a Ministry of Earth Sciences administrator for details." },
    SUSPENDED: { title: "Your trainer account was suspended", body: "Contact a platform administrator to restore access." },
  };
  const msg = STATUS_MSG[input.status];
  if (msg) {
    await notify({
      userId: input.teacherId,
      kind: `trainer_status.${input.status.toLowerCase()}`,
      title: msg.title,
      body: msg.body,
      href: input.status === "APPROVED" ? "/admin" : "/blocked",
    });
  }

  revalidatePath("/platform");
  revalidatePath("/platform/people");
  return { success: true as const };
}

/**
 * Change a user's global role, guarded by requireSuperAdmin. Refuses to demote
 * the last SUPER_ADMIN, and refuses to demote a trainer who still owns an ACTIVE
 * course (reassign it with assignTrainerToBatch first). Every change is audited.
 * Promotion carries APPROVED so the promoted staff member isn't left in limbo.
 */
export async function updateUserRoleAction(
  userId: string,
  role: Role,
): Promise<{ error?: string; success?: true }> {
  const session = await requireSuperAdmin();

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true },
  });
  if (!target) return { error: "User not found" };
  if (target.role === role) return { success: true };

  // Guard: never remove the last platform admin.
  if (target.role === "SUPER_ADMIN" && role !== "SUPER_ADMIN") {
    const superAdmins = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
    if (superAdmins <= 1) {
      return { error: "Cannot demote the last platform admin." };
    }
  }

  // Guard: a trainer being demoted must not still own an active course.
  if (target.role === "ADMIN" && role !== "ADMIN") {
    const activeOwned = await prisma.batch.count({
      where: { teacherId: userId, status: "ACTIVE" },
    });
    if (activeOwned > 0) {
      return {
        error: `Reassign this trainer's ${activeOwned} active course${activeOwned === 1 ? "" : "s"} before demoting them.`,
      };
    }
  }

  // Promotions land APPROVED; a demotion to trainee is also an approved state.
  const nextStatus: ApprovalStatus = "APPROVED";

  await prisma.user.update({
    where: { id: userId },
    data: { role, status: nextStatus },
  });

  await audit({
    actorId: session.user.id,
    targetId: userId,
    action: "role.change",
    fromValue: target.role,
    toValue: role,
    metadata: { statusFrom: target.status, statusTo: nextStatus },
  });

  revalidatePath("/platform");
  revalidatePath("/platform/people");
  return { success: true };
}

/**
 * Approve a trainee's TrainerRequest: promote them to ADMIN/APPROVED and mark the
 * request approved. This is the governed replacement for the self-promotion hole.
 */
export async function approveTrainerRequestAction(
  requestId: string,
): Promise<{ error?: string; success?: true }> {
  const session = await requireSuperAdmin();

  const request = await prisma.trainerRequest.findUnique({
    where: { id: requestId },
    select: { id: true, userId: true, status: true, user: { select: { role: true, status: true } } },
  });
  if (!request) return { error: "Request not found" };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: request.userId },
      data: { role: "ADMIN", status: "APPROVED" },
    }),
    prisma.trainerRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED", reviewedById: session.user.id, reviewedAt: new Date() },
    }),
  ]);

  await audit({
    actorId: session.user.id,
    targetId: request.userId,
    action: "trainer_request.approve",
    fromValue: request.user.role,
    toValue: "ADMIN",
  });

  await notify({
    userId: request.userId,
    kind: "trainer_request.approved",
    title: "Your trainer request was approved",
    body: "You now have trainer access — build your first course from the dashboard.",
    href: "/admin",
  });

  revalidatePath("/platform");
  revalidatePath("/platform/people");
  return { success: true };
}

export async function rejectTrainerRequestAction(
  requestId: string,
): Promise<{ error?: string; success?: true }> {
  const session = await requireSuperAdmin();

  const request = await prisma.trainerRequest.findUnique({
    where: { id: requestId },
    select: { id: true, userId: true },
  });
  if (!request) return { error: "Request not found" };

  await prisma.trainerRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED", reviewedById: session.user.id, reviewedAt: new Date() },
  });

  await audit({
    actorId: session.user.id,
    targetId: request.userId,
    action: "trainer_request.reject",
  });

  await notify({
    userId: request.userId,
    kind: "trainer_request.rejected",
    title: "Your trainer request was not approved",
    body: "You can still use Capacity Connect as a trainee. Contact an administrator for details.",
    href: "/student",
  });

  revalidatePath("/platform");
  revalidatePath("/platform/people");
  return { success: true };
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
