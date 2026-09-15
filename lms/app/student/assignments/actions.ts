"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const submissionSchema = z.object({
  assignmentId: z.string().min(1),
  body: z.string().min(1, "Write your answer").max(20000),
});

/**
 * Submit or re-submit an assignment.
 *
 * Re-submission is allowed until it has been graded — a trainee spotting a
 * mistake five minutes later should not have to ask the trainer to delete
 * anything. Once graded, the submission is frozen.
 */
export async function submitAssignmentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") return { error: "Not authorised." };

  const parsed = submissionSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const assignment = await prisma.assignment.findFirst({
    where: { id: parsed.data.assignmentId, isPublished: true },
    select: { id: true, batchId: true },
  });
  if (!assignment) return { error: "That assignment is not available." };

  const enrolment = await prisma.enrollment.findUnique({
    where: { studentId_batchId: { studentId: session.user.id, batchId: assignment.batchId } },
    select: { status: true },
  });
  if (enrolment?.status !== "APPROVED") return { error: "You are not enrolled on this course." };

  const existing = await prisma.assignmentSubmission.findUnique({
    where: {
      assignmentId_traineeId: { assignmentId: assignment.id, traineeId: session.user.id },
    },
    select: { id: true, gradedAt: true },
  });

  if (existing?.gradedAt) {
    return { error: "This has already been graded and can no longer be changed." };
  }

  await prisma.assignmentSubmission.upsert({
    where: {
      assignmentId_traineeId: { assignmentId: assignment.id, traineeId: session.user.id },
    },
    create: {
      assignmentId: assignment.id,
      traineeId: session.user.id,
      body: parsed.data.body,
    },
    update: { body: parsed.data.body, submittedAt: new Date() },
  });

  revalidatePath("/student/assignments");
  revalidatePath(`/student/assignments/${assignment.id}`);
  revalidatePath("/student/course");
  return { success: true };
}
