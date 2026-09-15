import { z } from "zod";

export const optionLetterSchema = z.enum(["A", "B", "C", "D"]);
export const difficultySchema = z.enum(["EASY", "MEDIUM", "HARD"]);

export const generatedQuestionSchema = z.object({
  question: z.string().min(8),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionC: z.string().min(1),
  optionD: z.string().min(1),
  correctOption: optionLetterSchema,
  difficulty: difficultySchema,
  explanation: z.string().min(1),
  competencyTag: z.string().max(80).nullable().optional(),
});

export const generatedQuestionsSchema = z
  .array(generatedQuestionSchema)
  .min(1)
  .max(20);

export const generateRequestSchema = z.object({
  testId: z.string().min(1),
  topic: z.string().min(3).max(120),
  sourceText: z.string().max(12000).optional(),
  count: z.coerce.number().int().min(5).max(20).default(5),
  difficultyMix: z.enum(["balanced", "easy", "hard"]).default("balanced"),
});

export const MARKS_BY_DIFFICULTY = { EASY: 1, MEDIUM: 2, HARD: 3 } as const;

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;
export type GenerateRequest = z.infer<typeof generateRequestSchema>;
