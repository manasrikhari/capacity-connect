"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { questionSchema, testMetaSchema } from "@/lib/validations/test";

function parseTestMetaForm(formData: FormData) {
  return testMetaSchema.safeParse({
    title: formData.get("title"),
    subject: formData.get("subject"),
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
    data: { title: parsed.data.title, subject: parsed.data.subject },
  });

  revalidatePath("/admin/tests");
  revalidatePath(`/admin/tests/${id}`);
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

  await prisma.question.create({
    data: { ...parsed.data, testId, order: (last?.order ?? 0) + 1 },
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

  await prisma.question.update({ where: { id }, data: parsed.data });

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
