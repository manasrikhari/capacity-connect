// Task 2.3 — Trainer↔course competency scoring. Pure module: no DB, no server
// imports. Given a course's skill requirements and a trainer's verified skill
// profile, produce a match score, a qualification verdict, and a per-skill
// breakdown that the UI renders as MET / PARTIAL / MISSING chips.

export type Req = {
  skillId: string;
  skillName: string;
  minProficiency: number;
  weight: number;
  isMandatory: boolean;
};

export type TS = { skillId: string; proficiency: number; isVerified: boolean };

export type TrainerMatch = {
  matchScore: number;
  isQualified: boolean;
  missingMandatoryCount: number;
  skillBreakdown: {
    skillName: string;
    requiredLevel: number;
    trainerLevel: number;
    status: "MET" | "PARTIAL" | "MISSING";
    weight: number;
  }[];
};

export const MANDATORY_GAP_CAP = 45;
export const QUALIFIED_THRESHOLD = 60;

const round1 = (n: number) => Math.round(n * 10) / 10;

export function scoreTrainer(
  requirements: Req[],
  trainerSkills: TS[],
  yearsExperience: number
): TrainerMatch {
  if (requirements.length === 0) {
    return {
      matchScore: 0,
      isQualified: false,
      missingMandatoryCount: 0,
      skillBreakdown: [],
    };
  }

  const byId = new Map<string, TS>();
  for (const ts of trainerSkills) byId.set(ts.skillId, ts);

  let weightedSum = 0;
  let weightTotal = 0;
  let missingMandatoryCount = 0;
  const skillBreakdown: TrainerMatch["skillBreakdown"] = [];

  for (const req of requirements) {
    const have = byId.get(req.skillId)?.proficiency ?? 0;
    const required = req.minProficiency;

    let status: "MET" | "PARTIAL" | "MISSING";
    if (have >= required) status = "MET";
    else if (have > 0) status = "PARTIAL";
    else status = "MISSING";

    if (status === "MISSING" && req.isMandatory) missingMandatoryCount++;

    const ratio = required > 0 ? Math.min(1, have / required) : 1;
    weightedSum += req.weight * ratio;
    weightTotal += req.weight;

    skillBreakdown.push({
      skillName: req.skillName,
      requiredLevel: required,
      trainerLevel: have,
      status,
      weight: req.weight,
    });
  }

  const raw = weightTotal > 0 ? (weightedSum / weightTotal) * 100 : 0;

  const reqIds = new Set(requirements.map((r) => r.skillId));
  const hasVerified = trainerSkills.some(
    (ts) => ts.isVerified && reqIds.has(ts.skillId)
  );
  const verifiedBonus = hasVerified ? 5 : 0;
  const experienceBonus =
    yearsExperience >= 5 ? 5 : yearsExperience >= 2 ? 2.5 : 0;

  let matchScore = round1(Math.min(100, raw + verifiedBonus + experienceBonus));

  // Verdict is decided on the un-capped score.
  const isQualified =
    missingMandatoryCount === 0 && matchScore >= QUALIFIED_THRESHOLD;

  // A trainer who is missing a mandatory skill cannot look strong regardless of
  // how well the other requirements score — clamp the headline number.
  if (missingMandatoryCount > 0 && matchScore > MANDATORY_GAP_CAP) {
    matchScore = MANDATORY_GAP_CAP;
  }

  return { matchScore, isQualified, missingMandatoryCount, skillBreakdown };
}

export type CategoryProfile = {
  category: string;
  average: number;
  count: number;
  max: 5;
};

export function summariseByCategory(
  skills: { category: string; proficiency: number }[]
): CategoryProfile[] {
  const groups = new Map<string, number[]>();
  for (const s of skills) {
    const arr = groups.get(s.category) ?? [];
    arr.push(s.proficiency);
    groups.set(s.category, arr);
  }

  return Array.from(groups.entries())
    .map(([category, values]) => ({
      category,
      average: round1(values.reduce((a, b) => a + b, 0) / values.length),
      count: values.length,
      max: 5 as const,
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
}
