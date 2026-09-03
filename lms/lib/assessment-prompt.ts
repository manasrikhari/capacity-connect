type Mix = "balanced" | "easy" | "hard";

const MIX_WEIGHTS: Record<Mix, { EASY: number; MEDIUM: number; HARD: number }> = {
  balanced: { EASY: 0.34, MEDIUM: 0.33, HARD: 0.33 },
  easy: { EASY: 0.6, MEDIUM: 0.3, HARD: 0.1 },
  hard: { EASY: 0.2, MEDIUM: 0.3, HARD: 0.5 },
};

/**
 * Split `count` questions across EASY/MEDIUM/HARD by the mix weights.
 * Floors each bucket, then assigns the leftover remainder to the
 * largest-weight bucket so the three counts sum to `count` exactly.
 */
export function difficultyMix(
  count: number,
  mix: Mix
): { EASY: number; MEDIUM: number; HARD: number } {
  const weights = MIX_WEIGHTS[mix];
  const result = {
    EASY: Math.floor(weights.EASY * count),
    MEDIUM: Math.floor(weights.MEDIUM * count),
    HARD: Math.floor(weights.HARD * count),
  };

  const remainder = count - (result.EASY + result.MEDIUM + result.HARD);

  // Largest-weight bucket gets the remainder.
  const largest = (Object.keys(weights) as (keyof typeof weights)[]).reduce(
    (best, key) => (weights[key] > weights[best] ? key : best),
    "EASY" as keyof typeof weights
  );
  result[largest] += remainder;

  return result;
}

export const ASSESSMENT_SYSTEM = [
  "You are an expert assessment author for the India Meteorological Department (IMD),",
  "with deep knowledge of operational meteorology, weather radar, numerical weather",
  "prediction, satellite meteorology, agrometeorology, and cyclone warning services.",
  "",
  "You write rigorous, factually correct multiple-choice questions (MCQs) for the",
  "capacity building and certification of meteorological trainees.",
  "",
  "OUTPUT RULES:",
  "- Output ONLY a single JSON object. No markdown, no prose, no code fences.",
  '- The object MUST have this exact shape: { "questions": [ ... ] }.',
  "- Each question object MUST have the keys: question, optionA, optionB, optionC,",
  "  optionD, correctOption, difficulty, explanation, competencyTag.",
  '- correctOption is exactly one of "A", "B", "C", "D".',
  '- difficulty is exactly one of "EASY", "MEDIUM", "HARD".',
  "- Write any mathematical notation as LaTeX delimited by $...$ (for example $Z = 200R^{1.6}$).",
  "- competencyTag MUST be one of the provided skill names, or null if none applies.",
  "- Every question must have exactly one unambiguously correct option and a clear explanation.",
].join("\n");

/**
 * Build the user prompt for a batch of generated questions.
 */
export function assessmentUserPrompt(args: {
  topic: string;
  count: number;
  mix: Mix;
  sourceText?: string;
  skillNames: string[];
}): string {
  const counts = difficultyMix(args.count, args.mix);
  const skills =
    args.skillNames.length > 0
      ? args.skillNames.map((s) => `"${s}"`).join(", ")
      : "(none provided)";

  const lines: string[] = [
    `Generate exactly ${args.count} multiple-choice questions on the topic: "${args.topic}".`,
    "",
    "Difficulty distribution (these counts must be respected exactly):",
    `- EASY: ${counts.EASY}`,
    `- MEDIUM: ${counts.MEDIUM}`,
    `- HARD: ${counts.HARD}`,
    "",
    `Allowed competencyTag values (use one of these exactly, or null): ${skills}`,
    "",
    "Return ONLY a single JSON object with this exact shape (no markdown, no code fences):",
    "{",
    '  "questions": [',
    "    {",
    '      "question": "string (LaTeX in $...$ where needed)",',
    '      "optionA": "string",',
    '      "optionB": "string",',
    '      "optionC": "string",',
    '      "optionD": "string",',
    '      "correctOption": "A" | "B" | "C" | "D",',
    '      "difficulty": "EASY" | "MEDIUM" | "HARD",',
    '      "explanation": "string",',
    '      "competencyTag": "one of the allowed skill names" | null',
    "    }",
    "  ]",
    "}",
  ];

  if (args.sourceText && args.sourceText.trim().length > 0) {
    lines.push(
      "",
      "Base the questions on the following source material where relevant:",
      "---",
      args.sourceText.trim(),
      "---"
    );
  }

  return lines.join("\n");
}
