"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { getActiveBatch } from "@/lib/batch";
import { nominate, type NominationOutcome } from "@/lib/invite";
import { notify } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { triggerEnrollmentUpdated } from "@/lib/pusher-server";
import { parseNominationList } from "@/lib/validations/nomination";

export type InviteTraineesState =
  | (NonNullable<ActionState> & { outcomes?: NominationOutcome[]; rejected?: string[] })
  | null;

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

/**
 * Invite trainees onto the active course by email.
 *
 * This closes a real gap found in the audit: a trainer could approve, reject or
 * remove an existing request, but had no way to *add* anyone — every trainee had
 * to self-initiate with a join code obtained out of band. Reuses the same
 * nomination primitive the SPOC surface uses, so an existing account is enrolled
 * immediately and a new one is sent an invitation.
 */
export async function inviteTraineesAction(
  _prev: InviteTraineesState,
  formData: FormData,
): Promise<InviteTraineesState> {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active course" };

  const { rows, rejected } = parseNominationList((formData.get("list") as string | null) ?? "");
  if (rows.length === 0) {
    return { error: "No valid email addresses found.", rejected };
  }

  const outcomes = await nominate({
    people: rows,
    batchId: batch.id,
    departmentId: null,
    invitedById: session.user.id,
  });

  revalidatePath("/admin/students");
  return { success: true, outcomes, rejected };
}
