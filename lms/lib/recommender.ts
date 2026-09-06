// Task 2.4 — Course recommender. Pure module: no DB, no server imports. Given a
// trainee's skill profile, quiz failures, and posting/department, score each
// candidate batch by how well it closes skill gaps (S_gap), remediates failed
// subjects (S_quiz), and fits the trainee's posting/department (S_dept), then
// rank. Human-readable `reasons` explain each recommendation.

import { DOMAIN_KEYWORDS } from "@/lib/taxonomy";

export type RecBatch = {
  id: string;
  name: string;
  subject: string | null;
  department: string | null;
  wmoTier: string | null;
  level: string | null;
};

export type RecReq = {
  skillId: string;
  skillName: string;
  minProficiency: number;
  weight: number;
};

export type FailedAttempt = {
  subject: string;
  testTitle: string;
  percent: number;
  batchSubject: string | null;
};

export type RecProfile = {
  postingLocation: string | null;
  department: string | null;
  /**
   * Operational domains the trainee says they work in, collected at onboarding.
   *
   * Without this a brand-new trainee has no skills, no quiz history and often no
   * posting match, so every course scored 1.0 and the ranking was arbitrary.
   * Stating the domains you work in is the one signal a new joiner can give on
   * day one.
   */
  interests?: string[];
} | null;

export type ScoreCourseInput = {
  batch: RecBatch;
  requirements: RecReq[];
  traineeSkills: { skillId: string; proficiency: number }[];
  failedAttempts: FailedAttempt[];
  profile: RecProfile;
  enrollmentStatus: "PENDING" | "REJECTED" | null;
};

export type CourseRecommendation = {
  batchId: string;
  name: string;
  domain: string | null;
  score: number;
  sGap: number;
  sQuiz: number;
  sDept: number;
  gaps: {
    skillName: string;
    required: number;
    have: number;
    gap: number;
    weight: number;
  }[];
  reasons: string[];
  enrollmentStatus: ScoreCourseInput["enrollmentStatus"];
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function textMatchesDomain(
  text: string | null | undefined,
  domain: string | null | undefined
): boolean {
  if (!text || !domain) return false;
  const haystack = text.toLowerCase();
  if (haystack.includes(domain.toLowerCase())) return true;
  const synonyms = DOMAIN_KEYWORDS[domain] ?? [];
  return synonyms.some((syn) => haystack.includes(syn.toLowerCase()));
}

export function failedSubjectMatchesBatch(
  f: FailedAttempt,
  batch: RecBatch
): boolean {
  if (batch.subject && f.subject === batch.subject) return true;
  if (textMatchesDomain(f.subject, batch.subject)) return true;
  if (batch.subject && f.batchSubject === batch.subject) return true;
  return false;
}

export function scoreCourse(input: ScoreCourseInput): CourseRecommendation {
  const { batch, requirements, traineeSkills, failedAttempts, profile } = input;
  const domain = batch.subject;

  const have = new Map<string, number>();
  for (const s of traineeSkills) have.set(s.skillId, s.proficiency);

  const gaps: CourseRecommendation["gaps"] = [];
  let gapSum = 0;
  for (const req of requirements) {
    const level = have.get(req.skillId) ?? 0;
    const gap = Math.max(0, req.minProficiency - level);
    if (gap > 0) {
      gaps.push({
        skillName: req.skillName,
        required: req.minProficiency,
        have: level,
        gap,
        weight: req.weight,
      });
      gapSum += gap * req.weight;
    }
  }

  const sGap = gapSum > 0 ? round2(gapSum) : 1.0;

  const matchedFailed = failedAttempts.find((f) =>
    failedSubjectMatchesBatch(f, batch)
  );
  const sQuiz = matchedFailed ? 1.4 : 1.0;

  const postingMatched =
    !!profile && textMatchesDomain(profile.postingLocation, batch.subject);
  const deptMatched =
    !!profile &&
    !!batch.department &&
    profile.department === batch.department;
  const interestMatched =
    !!profile && !!batch.subject && (profile.interests ?? []).includes(batch.subject);
  const sDept = postingMatched || deptMatched || interestMatched ? 1.3 : 1.0;

  const score = round2(sGap * sQuiz * sDept);

  const reasons: string[] = [];
  const topGaps = [...gaps]
    .sort((a, b) => b.gap * b.weight - a.gap * a.weight)
    .slice(0, 2);
  for (const g of topGaps) {
    reasons.push(
      `Closes a ${g.gap}-level gap in ${g.skillName} (required ${g.required}, you have ${g.have})`
    );
  }
  if (matchedFailed) {
    reasons.push(
      `You scored ${Math.round(matchedFailed.percent)}% in ${matchedFailed.testTitle}`
    );
  }
  if (postingMatched && profile) {
    reasons.push(
      `Your posting at ${profile.postingLocation} matches this ${domain} course`
    );
  } else if (deptMatched && batch.department) {
    reasons.push(`Offered by your department (${batch.department})`);
  }
  if (batch.wmoTier) {
    reasons.push(`Counts toward WMO ${batch.wmoTier}`);
  }
  if (input.enrollmentStatus === "PENDING") {
    reasons.push("Enrollment requested — awaiting approval");
  }
  if (reasons.length === 0) {
    reasons.push(`Broadens your ${domain} competencies`);
  }

  return {
    batchId: batch.id,
    name: batch.name,
    domain,
    score,
    sGap,
    sQuiz,
    sDept,
    gaps,
    reasons,
    enrollmentStatus: input.enrollmentStatus,
  };
}

export function rankCourses(
  inputs: ScoreCourseInput[],
  limit = 4
): CourseRecommendation[] {
  return inputs
    .map(scoreCourse)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
