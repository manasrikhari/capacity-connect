export type MetricsRows = {
  attendance: { status: "PRESENT" | "ABSENT"; count: number }[];
  approvedEnrollments: number;
  certifiedTrainees: number;
  attempts: { score: number; totalMarks: number }[];
  departments: { department: string; trainees: number; certified: number }[];
  domains: { domain: string; trainees: number; batches: number }[];
  /**
   * One row per (skill, trainee) pair the courses actually demand: the level a
   * course requires, and the level that trainee currently holds.
   */
  competency: {
    skill: string;
    category: string;
    required: number;
    held: number | null;
  }[];
};

export type CompetencyGap = {
  skill: string;
  category: string;
  /** Trainees expected to hold this skill. */
  expected: number;
  /** How many are below the level their course requires. */
  short: number;
  /** Share below the required level, 0-100. */
  gapPercent: number;
};

export type CapacityMetrics = {
  attendancePercent: number | null;
  completionPercent: number | null;
  certifiedCount: number;
  passRatePercent: number | null;
  totals: { attendanceMarks: number; enrollments: number; attempts: number };
  byDepartment: {
    department: string;
    trainees: number;
    certified: number;
    completionPercent: number | null;
  }[];
  byDomain: { domain: string; trainees: number; batches: number }[];
  /** Where the country is short, worst first — the training-needs view. */
  competencyGaps: CompetencyGap[];
  /** National capability per skill category, for the radar. */
  capabilityByCategory: { category: string; coveragePercent: number }[];
};

/** Round to one decimal place, guarding against NaN denominators. */
function pct(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export function computeCapacityMetrics(rows: MetricsRows): CapacityMetrics {
  const present = rows.attendance
    .filter((a) => a.status === "PRESENT")
    .reduce((sum, a) => sum + a.count, 0);
  const absent = rows.attendance
    .filter((a) => a.status === "ABSENT")
    .reduce((sum, a) => sum + a.count, 0);
  const attendanceMarks = present + absent;

  const passed = rows.attempts.filter(
    (a) => a.totalMarks > 0 && a.score / a.totalMarks >= 0.5
  ).length;

  const byDepartment = rows.departments
    .map((d) => ({
      department: d.department,
      trainees: d.trainees,
      certified: d.certified,
      completionPercent: pct(d.certified, d.trainees),
    }))
    .sort((a, b) => b.trainees - a.trainees);

  const byDomain = [...rows.domains].sort((a, b) => b.trainees - a.trainees);

  return {
    attendancePercent: pct(present, attendanceMarks),
    completionPercent: pct(rows.certifiedTrainees, rows.approvedEnrollments),
    certifiedCount: rows.certifiedTrainees,
    passRatePercent: pct(passed, rows.attempts.length),
    totals: {
      attendanceMarks,
      enrollments: rows.approvedEnrollments,
      attempts: rows.attempts.length,
    },
    byDepartment,
    byDomain,
    competencyGaps: computeCompetencyGaps(rows.competency),
    capabilityByCategory: computeCapabilityByCategory(rows.competency),
  };
}


/**
 * Which competencies the country is short of.
 *
 * Framed as the shortfall rather than the coverage on purpose: a ministry acts
 * on the gap, so the number that should be largest on screen is the one that
 * needs commissioning. A trainee with no record at all counts as short —
 * absence of evidence is not competence.
 *
 * IMD's own SOP asks for a "well defined Training need analysis system"; this
 * is the smallest honest version of it.
 */
export function computeCompetencyGaps(rows: MetricsRows["competency"]): CompetencyGap[] {
  const bySkill = new Map<string, { category: string; expected: number; short: number }>();

  for (const r of rows) {
    const entry = bySkill.get(r.skill) ?? { category: r.category, expected: 0, short: 0 };
    entry.expected += 1;
    if (r.held === null || r.held < r.required) entry.short += 1;
    bySkill.set(r.skill, entry);
  }

  return [...bySkill.entries()]
    .map(([skill, v]) => ({
      skill,
      category: v.category,
      expected: v.expected,
      short: v.short,
      gapPercent: v.expected === 0 ? 0 : Math.round((v.short / v.expected) * 100),
    }))
    .sort((a, b) => b.gapPercent - a.gapPercent || b.short - a.short || a.skill.localeCompare(b.skill));
}

/**
 * National capability per skill category: the share of demanded competencies
 * that are actually held, 0-100.
 *
 * The radar's job is to show the *shape* of national capability at a glance —
 * a dent is a category to commission training in. Percentages, not raw levels,
 * so categories with different numbers of skills stay comparable.
 */
export function computeCapabilityByCategory(
  rows: MetricsRows["competency"],
): { category: string; coveragePercent: number }[] {
  const byCategory = new Map<string, { met: number; expected: number }>();

  for (const r of rows) {
    const entry = byCategory.get(r.category) ?? { met: 0, expected: 0 };
    entry.expected += 1;
    if (r.held !== null && r.held >= r.required) entry.met += 1;
    byCategory.set(r.category, entry);
  }

  return [...byCategory.entries()]
    .map(([category, v]) => ({
      category,
      coveragePercent: v.expected === 0 ? 0 : Math.round((v.met / v.expected) * 100),
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
}