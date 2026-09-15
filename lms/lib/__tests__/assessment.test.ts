import { describe, expect, it } from "vitest";
import { stripJsonFences } from "@/lib/llm";
import { generatedQuestionsSchema } from "@/lib/validations/generated-question";
import { difficultyMix } from "@/lib/assessment-prompt";
import { QUESTION_BANK, pickBankQuestions } from "@/lib/question-bank";

const validQuestion = {
  question: "What is the Nyquist velocity formula?",
  optionA: "a",
  optionB: "b",
  optionC: "c",
  optionD: "d",
  correctOption: "A" as const,
  difficulty: "EASY" as const,
  explanation: "Because.",
  competencyTag: "radar",
};

describe("stripJsonFences (via llm.ts)", () => {
  it("strips code fences", () => {
    const raw = "```json\n{\"ok\":true}\n```";
    expect(stripJsonFences(raw)).toBe('{"ok":true}');
  });
});

describe("generatedQuestionsSchema", () => {
  it("rejects a lowercase correctOption", () => {
    const bad = [{ ...validQuestion, correctOption: "a" }];
    expect(generatedQuestionsSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects more than 20 items", () => {
    const tooMany = Array.from({ length: 21 }, () => ({ ...validQuestion }));
    expect(generatedQuestionsSchema.safeParse(tooMany).success).toBe(false);
  });

  it("accepts a well-formed array", () => {
    expect(generatedQuestionsSchema.safeParse([validQuestion]).success).toBe(true);
  });
});

describe("difficultyMix", () => {
  it("sums to count across 5, 7, 12, 20 for every mix", () => {
    for (const mix of ["balanced", "easy", "hard"] as const) {
      for (const count of [5, 7, 12, 20]) {
        const d = difficultyMix(count, mix);
        expect(d.EASY + d.MEDIUM + d.HARD).toBe(count);
        expect(d.EASY).toBeGreaterThanOrEqual(0);
        expect(d.MEDIUM).toBeGreaterThanOrEqual(0);
        expect(d.HARD).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe("pickBankQuestions", () => {
  it("returns `count` items, first 5 from the detected radar bank, honouring the mix", () => {
    const picked = pickBankQuestions("Doppler radar de-aliasing", 7, "balanced");
    expect(picked).toHaveLength(7);

    const radarQuestions = QUESTION_BANK.radar.map((q) => q.question);
    for (let i = 0; i < 5; i++) {
      expect(radarQuestions).toContain(picked[i].question);
    }

    const hardCount = picked.filter((q) => q.difficulty === "HARD").length;
    expect(hardCount).toBe(difficultyMix(7, "balanced").HARD);
  });

  it("is deterministic/repeatable", () => {
    const a = pickBankQuestions("Doppler radar de-aliasing", 7, "balanced");
    const b = pickBankQuestions("Doppler radar de-aliasing", 7, "balanced");
    expect(a).toEqual(b);
  });

  it("does not mutate the source bank difficulties", () => {
    const before = QUESTION_BANK.radar.map((q) => q.difficulty);
    pickBankQuestions("radar", 5, "hard");
    const after = QUESTION_BANK.radar.map((q) => q.difficulty);
    expect(after).toEqual(before);
  });
});
