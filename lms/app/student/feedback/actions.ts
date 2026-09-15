"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { getActiveStudentBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { feedbackSchema } from "@/lib/validations/feedback";

/**
 * Submit (or update) the signed-in trainee's feedback for their active course.
 * Requires an APPROVED enrollment — getActiveStudentBatch only resolves a batch
 * the trainee is approved in.
 */
export async function submitFeedbackAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") {
    return { error: "Only trainees can submit feedback." };
  }

  const batch = await getActiveStudentBatch(session);
  if (!batch) return { error: "You are not enrolled in an active course." };

  const parsed = feedbackSchema.safeParse({
    overallRating: formData.get("overallRating"),
    contentRating: formData.get("contentRating") || undefined,
    trainerRating: formData.get("trainerRating") || undefined,
    infrastructureRating: formData.get("infrastructureRating") || undefined,
    comments: formData.get("comments"),
    suggestions: formData.get("suggestions"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;
  const data = {
    overallRating: d.overallRating,
    contentRating: d.contentRating ?? null,
    trainerRating: d.trainerRating ?? null,
    infrastructureRating: d.infrastructureRating ?? null,
    comments: d.comments || null,
    suggestions: d.suggestions || null,
  };

  await prisma.feedback.upsert({
    where: { batchId_traineeId: { batchId: batch.id, traineeId: session.user.id } },
    create: { batchId: batch.id, traineeId: session.user.id, ...data },
    update: data,
  });

  revalidatePath("/student/feedback");
  revalidatePath("/admin/feedback");
  return { success: true };
}
