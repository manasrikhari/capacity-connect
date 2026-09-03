"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/app/generated/prisma/client";
import type { ActionState } from "@/lib/action-state";
import { auth } from "@/lib/auth";
import { getActiveStudentBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { isTestOpen } from "@/lib/utils";
import { testSubmissionSchema } from "@/lib/validations/test";

export async function submitTest(testId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") {
    return { error: "Unauthorized." };
  }
  const batch = await getActiveStudentBatch(session);
  if (!batch) {
    return { error: "No active batch." };
  }

  const studentId = session.user.id;

  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: { questions: true },
  });
  if (!test || test.batchId !== batch.id) {
    return { error: "This test is not available." };
  }
  if (!isTestOpen(test)) {
    return { error: "This test has closed." };
  }

  const existing = await prisma.testAttempt.findUnique({
    where: { testId_studentId: { testId, studentId } },
  });
  if (existing) {
    return { error: "You've already attempted this test." };
  }

  const answers: Record<string, string> = {};
  for (const question of test.questions) {
    const value = formData.get(`answer-${question.id}`);
    if (typeof value === "string" && value) {
      answers[question.id] = value;
    }
  }

  if (Object.keys(answers).length !== test.questions.length) {
    return { error: "Please answer all questions before submitting." };
  }

  const parsed = testSubmissionSchema.safeParse({ testId, answers });
  if (!parsed.success) {
    return { error: "Invalid submission." };
  }

  let score = 0;
  let totalMarks = 0;
  for (const question of test.questions) {
    totalMarks += question.marks;
    if (parsed.data.answers[question.id] === question.correctOption) {
      score += question.marks;
    }
  }

  try {
    await prisma.testAttempt.create({
      data: {
        testId,
        studentId,
        batchId: batch.id,
        answers: JSON.stringify(parsed.data.answers),
        score,
        totalMarks,
      },
    });
  } catch (error) {
    // Unique constraint (testId, studentId): a concurrent submission won the race.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "You've already attempted this test." };
    }
    throw error;
  }

  revalidatePath("/student/tests");
  revalidatePath(`/student/tests/${testId}`);
  redirect(`/student/tests/${testId}`);
}
