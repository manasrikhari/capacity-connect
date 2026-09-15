"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { questionSchema, testMetaSchema } from "@/lib/validations/test";

// Empty form fields arrive as "" — normalise to undefined so optional Zod
// fields (and schema defaults) behave, and so an empty skill select never
// becomes an invalid foreign key.
function blankToUndefined(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function parseTestMetaForm(formData: FormData) {
  return testMetaSchema.safeParse({
    title: formData.get("title"),
    subject: formData.get("subject"),
    closesAt: formData.get("closesAt"),
    durationMins: blankToUndefined(formData.get("durationMins")),
    passPercent: blankToUndefined(formData.get("passPercent")),
    skillId: blankToUndefined(formData.get("skillId")),
  });
}

function parseQuestionForm(formData: FormData) {
  return questionSchema.safeParse({
    question: formData.get("question"),
    optionA: formData.get("optionA"),
    optionB: formData.get("optionB"),
    optionC: formData.get("optionC"),
    optionD: formData.get("optionD"),
    correctOption: formData.get("correctOption"),
    marks: formData.get("marks"),
    difficulty: blankToUndefined(formData.get("difficulty")),
    explanation: formData.get("explanation") ?? undefined,
    skillId: blankToUndefined(formData.get("skillId")),
  });
}

/** Skills available for tagging tests and questions (used by the form modals). */
export async function listAllSkills(): Promise<{ id: string; name: string }[]> {
  await requireAdmin();
  return prisma.skill.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function createTest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active batch" };

  const parsed = parseTestMetaForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const test = await prisma.test.create({
    data: {
      batchId: batch.id,
      title: parsed.data.title,
      subject: parsed.data.subject,
      closesAt: parsed.data.closesAt,
      durationMins: parsed.data.durationMins ?? null,
      passPercent: parsed.data.passPercent,
      skillId: parsed.data.skillId || null,
      isActive: false,
    },
  });

  revalidatePath("/admin/tests");
  redirect(`/admin/tests/${test.id}`);
}

export async function updateTest(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active batch" };

  const parsed = parseTestMetaForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const test = await prisma.test.findUnique({ where: { id } });
  if (!test || test.batchId !== batch.id) return { error: "Test not found" };

  await prisma.test.update({
    where: { id },
    data: {
      title: parsed.data.title,
      subject: parsed.data.subject,
      closesAt: parsed.data.closesAt,
      durationMins: parsed.data.durationMins ?? null,
      passPercent: parsed.data.passPercent,
      skillId: parsed.data.skillId || null,
    },
  });

  revalidatePath("/admin/tests");
  revalidatePath(`/admin/tests/${id}`);
  revalidatePath("/student/tests");
  return { success: true };
}

export async function toggleTestActive(id: string) {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active batch" };

  const test = await prisma.test.findUnique({ where: { id }, include: { _count: { select: { questions: true } } } });
  if (!test || test.batchId !== batch.id) return { error: "Test not found" };

  if (!test.isActive && test._count.questions === 0) {
    return { error: "Add at least one question before activating this test" };
  }

  await prisma.test.update({ where: { id }, data: { isActive: !test.isActive } });

  revalidatePath("/admin/tests");
  revalidatePath(`/admin/tests/${id}`);
  revalidatePath("/student/tests");
  return { success: true as const };
}

export async function deleteTest(id: string) {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active batch" };

  const test = await prisma.test.findUnique({ where: { id } });
  if (!test || test.batchId !== batch.id) return { error: "Test not found" };

  await prisma.test.delete({ where: { id } });

  revalidatePath("/admin/tests");
  revalidatePath("/student/tests");
  return { success: true as const };
}

export async function addQuestion(
  testId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active batch" };

  const parsed = parseQuestionForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const test = await prisma.test.findUnique({ where: { id: testId } });
  if (!test || test.batchId !== batch.id) return { error: "Test not found" };

  const last = await prisma.question.findFirst({ where: { testId }, orderBy: { order: "desc" } });

  const { difficulty, explanation, skillId, ...core } = parsed.data;
  await prisma.question.create({
    data: {
      ...core,
      difficulty: difficulty ?? null,
      explanation: explanation || null,
      skillId: skillId || null,
      testId,
      order: (last?.order ?? 0) + 1,
    },
  });

  revalidatePath(`/admin/tests/${testId}`);
  return { success: true };
}

export async function updateQuestion(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active batch" };

  const parsed = parseQuestionForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const question = await prisma.question.findUnique({ where: { id }, include: { test: true } });
  if (!question || question.test.batchId !== batch.id) return { error: "Question not found" };

  const { difficulty, explanation, skillId, ...core } = parsed.data;
  await prisma.question.update({
    where: { id },
    data: {
      ...core,
      difficulty: difficulty ?? null,
      explanation: explanation || null,
      skillId: skillId || null,
    },
  });

  revalidatePath(`/admin/tests/${question.testId}`);
  return { success: true };
}

export async function deleteQuestion(id: string) {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active batch" };

  const question = await prisma.question.findUnique({ where: { id }, include: { test: true } });
  if (!question || question.test.batchId !== batch.id) return { error: "Question not found" };

  await prisma.question.delete({ where: { id } });

  revalidatePath(`/admin/tests/${question.testId}`);
  return { success: true as const };
}
