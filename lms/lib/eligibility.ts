/**
 * Course eligibility, drawn straight from IMD's SOP. Its clauses are formal and
 * checkable — the Forecaster's Training Course wants a science graduate with
 * Physics and Mathematics, *plus* a completed Intermediate/BIP-MT course, *plus*
 * five years in the Met-A cadre. This evaluates such a rule set against a
 * trainee's profile as a pure function.
 *
 * The result is ADVISORY, never a hard block: the course page shows "you meet 3
 * of 4 requirements" and the trainer sees the same on the enrolment request so
 * they can approve an exception deliberately.
 */

export type EligibilityRule = {
  /** Keywords that must each appear in some qualification (degree/institution). */
  requiredQualifications?: string[];
  /** A human label for the qualification requirement (shown instead of raw keywords). */
  qualificationLabel?: string;
  /** IMD cadre the trainee must hold, e.g. "Met-A". */
  requiredCadre?: string;
  /** Minimum years of experience. */
  minYearsExperience?: number;
  /** Course ids the trainee must have completed first. */
  prerequisiteCourseIds?: string[];
};

export type EligibilityProfile = {
  cadre?: string | null;
  yearsExperience?: number | null;
  qualifications?: { degree?: string | null; institution?: string | null }[] | null;
  /** Course ids the trainee has completed (certified). */
  completedCourseIds?: string[];
};

export type EligibilityCheck = {
  key: string;
  label: string;
  met: boolean;
  /** Shown when unmet — what's missing and, ideally, where to get it. */
  detail?: string;
};

export type EligibilityResult = {
  /** False when the course declares no rules — then eligibility is irrelevant. */
  applicable: boolean;
  metCount: number;
  totalCount: number;
  allMet: boolean;
  checks: EligibilityCheck[];
};

/** True when `rule` has at least one constraint worth checking. */
export function hasEligibilityRules(rule: EligibilityRule | null | undefined): boolean {
  if (!rule) return false;
  return Boolean(
    (rule.requiredQualifications && rule.requiredQualifications.length > 0) ||
      rule.requiredCadre ||
      typeof rule.minYearsExperience === "number" ||
      (rule.prerequisiteCourseIds && rule.prerequisiteCourseIds.length > 0),
  );
}

/** Coerce an unknown Json value into a typed rule (nulls/garbage → empty rule). */
export function coerceEligibilityRule(value: unknown): EligibilityRule {
  if (!value || typeof value !== "object") return {};
  const v = value as Record<string, unknown>;
  const rule: EligibilityRule = {};
  if (Array.isArray(v.requiredQualifications)) {
    rule.requiredQualifications = v.requiredQualifications.filter((s): s is string => typeof s === "string");
  }
  if (typeof v.qualificationLabel === "string") rule.qualificationLabel = v.qualificationLabel;
  if (typeof v.requiredCadre === "string") rule.requiredCadre = v.requiredCadre;
  if (typeof v.minYearsExperience === "number") rule.minYearsExperience = v.minYearsExperience;
  if (Array.isArray(v.prerequisiteCourseIds)) {
    rule.prerequisiteCourseIds = v.prerequisiteCourseIds.filter((s): s is string => typeof s === "string");
  }
  return rule;
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Evaluate a rule set against a trainee profile. `courseNameById` maps
 * prerequisite ids to names so unmet checks read "…complete the Intermediate
 * Training Course" rather than an opaque id.
 */
export function evaluateEligibility(
  rule: EligibilityRule | null | undefined,
  profile: EligibilityProfile,
  courseNameById: Record<string, string> = {},
): EligibilityResult {
  const r = rule ?? {};
  const checks: EligibilityCheck[] = [];

  if (r.requiredQualifications && r.requiredQualifications.length > 0) {
    const haystack = (profile.qualifications ?? [])
      .map((q) => `${q.degree ?? ""} ${q.institution ?? ""}`)
      .join(" ");
    const normHay = norm(haystack);
    const missing = r.requiredQualifications.filter((kw) => !normHay.includes(norm(kw)));
    const label = r.qualificationLabel ?? r.requiredQualifications.join(", ");
    checks.push({
      key: "qualification",
      label,
      met: missing.length === 0,
      detail: missing.length ? `Your profile does not list: ${missing.join(", ")}` : undefined,
    });
  }

  if (r.requiredCadre) {
    const met = !!profile.cadre && norm(profile.cadre) === norm(r.requiredCadre);
    checks.push({
      key: "cadre",
      label: `${r.requiredCadre} cadre`,
      met,
      detail: met ? undefined : `Requires the ${r.requiredCadre} cadre`,
    });
  }

  if (typeof r.minYearsExperience === "number") {
    const years = profile.yearsExperience ?? 0;
    const met = years >= r.minYearsExperience;
    checks.push({
      key: "experience",
      label: `${r.minYearsExperience}+ years of experience`,
      met,
      detail: met ? undefined : `You have ${years} of ${r.minYearsExperience} years required`,
    });
  }

  if (r.prerequisiteCourseIds && r.prerequisiteCourseIds.length > 0) {
    const completed = new Set(profile.completedCourseIds ?? []);
    for (const id of r.prerequisiteCourseIds) {
      const name = courseNameById[id] ?? "a prerequisite course";
      const met = completed.has(id);
      checks.push({
        key: `prerequisite:${id}`,
        label: `Completed ${name}`,
        met,
        detail: met ? undefined : `You have not completed ${name}`,
      });
    }
  }

  const metCount = checks.filter((c) => c.met).length;
  return {
    applicable: checks.length > 0,
    metCount,
    totalCount: checks.length,
    allMet: checks.length > 0 && metCount === checks.length,
    checks,
  };
}
