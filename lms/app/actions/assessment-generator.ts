"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { ASSESSMENT_SYSTEM, assessmentUserPrompt } from "@/lib/assessment-prompt";
import { getActiveBatch } from "@/lib/batch";
import { completeText, hasLlmKey, stripJsonFences } from "@/lib/llm";
import { prisma } from "@/lib/prisma";
import { pickBankQuestions } from "@/lib/question-bank";
import { requireAdmin } from "@/lib/session";
import {
  generatedQuestionsSchema,
  generateRequestSchema,
  MARKS_BY_DIFFICULTY,
  type GeneratedQuestion,
} from "@/lib/validations/generated-question";

/**
 * Richer than {@link ActionState}: on success it carries the generated
 * questions so the page can render an editable preview before they are saved.
 */
export type GenerateQuestionsState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
  data?: {
    questions: GeneratedQuestion[];
    source: "llm" | "bank";
    testId: string;
  };
} | null;

const MAX_SOURCE_CHARS = 12_000;

export async function generateQuestionsAction(
  _prev: GenerateQuestionsState,
  formData: FormData
): Promise<GenerateQuestionsState> {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active batch" };

  const parsed = generateRequestSchema.safeParse({
    testId: formData.get("testId"),
    topic: formData.get("topic"),
    sourceText: (formData.get("sourceText") as string) || undefined,
    count: (formData.get("count") as string) || undefined,
    difficultyMix: (formData.get("difficultyMix") as string) || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { testId, topic, count, difficultyMix: mix } = parsed.data;

  // Ownership: the test must belong to the trainer's active course.
  const test = await prisma.test.findUnique({ where: { id: testId } });
  if (!test || test.batchId !== batch.id) return { error: "Test not found" };

  // The course's competencies become the allowed competencyTag vocabulary.
  const reqs = await prisma.batchSkillRequirement.findMany({
    where: { batchId: batch.id },
    include: { skill: { select: { name: true } } },
  });
  const skillNames = reqs.map((r) => r.skill.name);

  // Optionally ground the questions in the course's own notes.
  let sourceText = parsed.data.sourceText;
  if (formData.get("useNotes") === "on") {
    const notes = await prisma.note.findMany({
      where: { batchId: batch.id },
      select: { title: true, content: true },
    });
    const joined = notes.map((n) => `# ${n.title}\n${n.content}`).join("\n\n");
    sourceText = [sourceText, joined].filter(Boolean).join("\n\n").slice(0, MAX_SOURCE_CHARS) || undefined;
  }

  // No model key configured → serve deterministic offline-bank questions.
  if (!hasLlmKey()) {
    return { data: { questions: pickBankQuestions(topic, count, mix), source: "bank", testId } };
  }

  const baseUser = assessmentUserPrompt({ topic, count, mix, sourceText, skillNames });
  let lastIssues = "";

  // Up to two attempts; the retry tells the model why the first output failed.
  for (let attempt = 0; attempt < 2; attempt++) {
    const user =
      attempt === 0
        ? baseUser
        : `${baseUser}\n\nYour previous output failed validation: ${lastIssues}`;
    try {
      const raw = await completeText({ system: ASSESSMENT_SYSTEM, user });
      const json: unknown = JSON.parse(stripJsonFences(raw));
      const arr = Array.isArray(json)
        ? json
        : (json as { questions?: unknown })?.questions;
      const result = generatedQuestionsSchema.safeParse(arr);
      if (result.success) {
        return { data: { questions: result.data, source: "llm", testId } };
      }
      lastIssues = result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")
        .slice(0, 1500);
    } catch (error) {
      lastIssues = error instanceof Error ? error.message : "Output was not valid JSON.";
    }
  }

  // Both attempts failed — fall back to the bank rather than throwing.
  return { data: { questions: pickBankQuestions(topic, count, mix), source: "bank", testId } };
}

export async function insertGeneratedQuestionsAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active batch" };

  const testId = formData.get("testId");
  const rawJson = formData.get("questions");
  if (typeof testId !== "string" || typeof rawJson !== "string") {
    return { error: "Nothing to insert." };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawJson);
  } catch {
    return { error: "Could not read the edited questions." };
  }

  const result = generatedQuestionsSchema.safeParse(parsedJson);
  if (!result.success) {
    return { error: "Some questions are incomplete. Please review every field and try again." };
  }

  const test = await prisma.test.findUnique({ where: { id: testId } });
  if (!test || test.batchId !== batch.id) return { error: "Test not found" };

  // Resolve competencyTag → skillId by case-insensitive Skill name lookup.
  const allSkills = await prisma.skill.findMany({ select: { id: true, name: true } });
  const skillByLower = new Map(allSkills.map((s) => [s.name.toLowerCase(), s.id]));
  const resolveSkillId = (tag: string | null | undefined): string | null => {
    const key = tag?.trim().toLowerCase();
    return (key && skillByLower.get(key)) || null;
  };

  await prisma.$transaction(async (tx) => {
    const last = await tx.question.findFirst({ where: { testId }, orderBy: { order: "desc" } });
    let order = last?.order ?? 0;
    await tx.question.createMany({
      data: result.data.map((q) => ({
        testId,
        question: q.question,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: q.correctOption,
        marks: MARKS_BY_DIFFICULTY[q.difficulty],
        difficulty: q.difficulty,
        explanation: q.explanation,
        skillId: resolveSkillId(q.competencyTag),
        order: ++order,
      })),
    });
  });

  revalidatePath(`/admin/tests/${testId}`);
  return { success: true };
}
