import { z } from "zod";

// Strictly "A" | "B" | "C" | "D" - case-sensitive, nothing else accepted.
export const optionLetterSchema = z.enum(["A", "B", "C", "D"]);

export const questionSchema = z.object({
  question: z.string().min(1, "Question text is required"),
  optionA: z.string().min(1, "Option A is required"),
  optionB: z.string().min(1, "Option B is required"),
  optionC: z.string().min(1, "Option C is required"),
  optionD: z.string().min(1, "Option D is required"),
  correctOption: optionLetterSchema,
  marks: z.coerce.number().int().min(1, "Marks must be at least 1").max(100),
});

export const testSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  subject: z.string().min(1, "Subject is required").max(100),
  isActive: z.boolean().default(false),
  questions: z.array(questionSchema).min(1, "Add at least one question"),
});

// Used for the create/edit test form, where questions are managed separately.
export const testMetaSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  subject: z.string().min(1, "Subject is required").max(100),
});

export type QuestionInput = z.infer<typeof questionSchema>;
export type TestInput = z.infer<typeof testSchema>;
export type TestMetaInput = z.infer<typeof testMetaSchema>;

// Submission: maps questionId -> selected option ("A" | "B" | "C" | "D")
export const testSubmissionSchema = z.object({
  testId: z.string().min(1),
  answers: z.record(z.string(), optionLetterSchema),
});

export type TestSubmissionInput = z.infer<typeof testSubmissionSchema>;
