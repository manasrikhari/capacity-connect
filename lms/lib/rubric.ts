/**
 * Rubric scoring for assignments.
 *
 * Pure, so the arithmetic is testable. Assessment in this platform was, until
 * now, a single `===` against a four-option MCQ; IMD's SOP counts "solving
 * problems/puzzles, making presentations, completing practical assignments" as
 * internal assessment, none of which an MCQ can express.
 */

export type RubricCriterion = {
  label: string;
  maxPoints: number;
  guidance?: string;
};

export type CriterionScore = {
  label: string;
  points: number;
};

export type GradeSummary = {
  total: number;
  max: number;
  percent: number;
  /** Criteria the grader has not scored yet. */
  missing: string[];
  isComplete: boolean;
};

/** Coerce a stored Json rubric into typed criteria, dropping anything malformed. */
export function coerceRubric(value: unknown): RubricCriterion[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((c): c is Record<string, unknown> => typeof c === "object" && c !== null)
    .map((c) => ({
      label: String(c.label ?? "").trim(),
      maxPoints: Number(c.maxPoints),
      guidance: typeof c.guidance === "string" ? c.guidance : undefined,
    }))
    .filter((c) => c.label.length > 0 && Number.isFinite(c.maxPoints) && c.maxPoints > 0);
}

/** Coerce stored per-criterion scores. */
export function coerceScores(value: unknown): CriterionScore[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((s): s is Record<string, unknown> => typeof s === "object" && s !== null)
    .map((s) => ({ label: String(s.label ?? "").trim(), points: Number(s.points) }))
    .filter((s) => s.label.length > 0 && Number.isFinite(s.points));
}

/**
 * Parse a textarea of "label | maxPoints | guidance" lines, mirroring how
 * qualifications and work history are already edited in this codebase.
 */
export function parseRubric(raw: string): RubricCriterion[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [label = "", points = "", guidance = ""] = line.split("|").map((s) => s.trim());
      const maxPoints = Number.parseInt(points, 10);
      return {
        label,
        maxPoints: Number.isFinite(maxPoints) ? maxPoints : 0,
        guidance: guidance || undefined,
      };
    })
    .filter((c) => c.label.length > 0 && c.maxPoints > 0);
}

/** Total points a rubric can award. Falls back to the assignment's own max. */
export function rubricMax(rubric: RubricCriterion[], fallback: number): number {
  if (rubric.length === 0) return fallback;
  return rubric.reduce((n, c) => n + c.maxPoints, 0);
}

/**
 * Score a submission against its rubric.
 *
 * Each criterion is clamped to its own maximum, so a slip in the grading form
 * cannot push a submission past 100%, and negative points are floored at zero.
 */
export function gradeSubmission(
  rubric: RubricCriterion[],
  scores: CriterionScore[],
  fallbackMax: number,
): GradeSummary {
  const max = rubricMax(rubric, fallbackMax);

  if (rubric.length === 0) {
    // No rubric: a single holistic mark, still clamped to the maximum.
    const raw = scores[0]?.points ?? 0;
    const total = Math.max(0, Math.min(raw, max));
    return {
      total,
      max,
      percent: max === 0 ? 0 : Math.round((total / max) * 100),
      missing: scores.length === 0 ? ["Overall"] : [],
      isComplete: scores.length > 0,
    };
  }

  const byLabel = new Map(scores.map((s) => [s.label, s.points]));
  const missing: string[] = [];
  let total = 0;

  for (const c of rubric) {
    const raw = byLabel.get(c.label);
    if (raw === undefined) {
      missing.push(c.label);
      continue;
    }
    total += Math.max(0, Math.min(raw, c.maxPoints));
  }

  return {
    total,
    max,
    percent: max === 0 ? 0 : Math.round((total / max) * 100),
    missing,
    isComplete: missing.length === 0,
  };
}

/** Whether a submission arrived after the deadline. */
export function isLate(
  submittedAt: Date,
  dueAt: Date | null | undefined,
): boolean {
  if (!dueAt) return false;
  return submittedAt.getTime() > dueAt.getTime();
}
