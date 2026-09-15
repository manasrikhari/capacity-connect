"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import type { ActionState } from "@/lib/action-state";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { coerceRubric, gradeSubmission, parseRubric, rubricMax } from "@/lib/rubric";
import { requireAdmin } from "@/lib/session";
import { optionalFormId, optionalFormString } from "@/lib/validations/form";

const assignmentSchema = z.object({
  title: z.string().min(3, "Give the assignment a title").max(200),
  brief: z.string().min(10, "Describe what the trainee has to do").max(8000),
  rubric: optionalFormString(4000),
  maxPoints: z.coerce.number().int().min(1).max(1000).default(100),
  dueAt: optionalFormString(40),
  weekId: optionalFormId(),
  skillId: optionalFormId(),
});

export async function createAssignmentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active course." };

  const parsed = assignmentSchema.safeParse({
    title: formData.get("title"),
    brief: formData.get("brief"),
    rubric: formData.get("rubric"),
    maxPoints: formData.get("maxPoints"),
    dueAt: formData.get("dueAt"),
    weekId: formData.get("weekId"),
    skillId: formData.get("skillId"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const rubric = parseRubric(parsed.data.rubric ?? "");
  const due = parsed.data.dueAt ? new Date(parsed.data.dueAt) : null;
  if (due && Number.isNaN(due.getTime())) {
    return { fieldErrors: { dueAt: ["Enter a valid date"] } };
  }

  await prisma.assignment.create({
    data: {
      batchId: batch.id,
      weekId: parsed.data.weekId,
      skillId: parsed.data.skillId,
      title: parsed.data.title,
      brief: parsed.data.brief,
      // A rubric that totals more than the stated maximum is confusing, so the
      // rubric wins — it is the thing the grader actually fills in.
      maxPoints: rubricMax(rubric, parsed.data.maxPoints),
      rubric: rubric.length > 0 ? (rubric as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
      dueAt: due,
    },
  });

  revalidatePath("/admin/assignments");
  revalidatePath("/student/assignments");
  return { success: true };
}

export async function togglePublishAssignmentAction(id: string): Promise<{ error?: string }> {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active course." };

  const a = await prisma.assignment.findFirst({
    where: { id, batchId: batch.id },
    select: { id: true, isPublished: true },
  });
  if (!a) return { error: "That assignment is not part of this course." };

  await prisma.assignment.update({
    where: { id },
    data: { isPublished: !a.isPublished },
  });

  revalidatePath("/admin/assignments");
  revalidatePath("/student/assignments");
  revalidatePath("/student/course");
  return {};
}

/**
 * Grade a submission against its rubric.
 *
 * Scores arrive as `score:<label>` fields so the form can be rendered straight
 * from the rubric without a second source of truth about criterion names.
 */
export async function gradeSubmissionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active course." };

  const submissionId = String(formData.get("submissionId") ?? "");
  const submission = await prisma.assignmentSubmission.findFirst({
    where: { id: submissionId, assignment: { batchId: batch.id } },
    select: {
      id: true,
      traineeId: true,
      assignment: { select: { id: true, title: true, rubric: true, maxPoints: true, skillId: true } },
    },
  });
  if (!submission) return { error: "That submission is not part of this course." };

  const rubric = coerceRubric(submission.assignment.rubric);
  const scores = rubric.length
    ? rubric.map((c) => ({
        label: c.label,
        points: Number(formData.get(`score:${c.label}`) ?? Number.NaN),
      }))
    : [{ label: "Overall", points: Number(formData.get("score:Overall") ?? Number.NaN) }];

  const provided = scores.filter((s) => Number.isFinite(s.points));
  if (provided.length === 0) return { error: "Enter at least one score." };

  const grade = gradeSubmission(rubric, provided, submission.assignment.maxPoints);
  const feedback = String(formData.get("feedback") ?? "").slice(0, 4000);

  await prisma.assignmentSubmission.update({
    where: { id: submission.id },
    data: {
      scores: provided as unknown as Prisma.InputJsonValue,
      totalScore: grade.total,
      feedback: feedback || null,
      gradedById: session.user.id,
      gradedAt: new Date(),
    },
  });

  revalidatePath("/admin/assignments");
  revalidatePath("/student/assignments");
  return { success: true };
}
