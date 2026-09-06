/**
 * The ministry analyst: natural-language questions over national training data.
 *
 * The governing rule, and the reason this file is shaped the way it is: **the
 * model never produces a number.** Every figure shown comes from
 * `computeCapacityMetrics`; the model's only jobs are to choose which existing
 * analysis answers the question and to write the interpretation around it. A
 * ministry acting on a hallucinated statistic is worse than no assistant at
 * all, so the arithmetic is never delegated.
 *
 * Pure — no Prisma, no React, no network — so the prompt construction, the
 * reply parsing and the offline fallback are all directly testable.
 */

import type { CapacityMetrics } from "@/lib/metrics";

/** The analyses the assistant is allowed to put on screen. */
export const ANALYSES = [
  {
    id: "competency-gaps",
    label: "Competency shortfalls",
    about: "which competencies trainees are short of, and by how much",
  },
  {
    id: "capability-by-domain",
    label: "Shortfall by domain",
    about: "which operational domains are weakest overall",
  },
  {
    id: "certified-by-department",
    label: "Certification by department",
    about: "which departments are certifying their people and which are not",
  },
  {
    id: "trainees-by-domain",
    label: "Trainees by domain",
    about: "where the trainee population sits across domains",
  },
  {
    id: "outcomes",
    label: "Outcomes",
    about: "attendance, certification rate, assessment pass rate",
  },
] as const;

export type AnalysisId = (typeof ANALYSES)[number]["id"];

export type AnalystAnswer = {
  /** Prose interpretation. Never the source of any figure. */
  answer: string;
  /** Which analysis to render beneath the answer, if any. */
  chart: AnalysisId | null;
  /** True when no model was available and the deterministic path was used. */
  offline: boolean;
};

export const ANALYST_SYSTEM = `You are an analyst for India's Ministry of Earth Sciences, reporting on national
meteorological training capacity.

You are given the current figures. Use ONLY those figures — never estimate,
extrapolate or invent a number. If the figures do not answer the question, say
so plainly and say what would be needed.

Write for a senior civil servant: three or four sentences, plain English, no
bullet points, no headings, no markdown. Lead with the answer. Where it is
warranted, end with one concrete recommendation about what training to
commission. Do not congratulate or editorialise.

Reply as JSON only:
{"answer": "<your prose>", "chart": "<analysis id or null>"}`;

/**
 * Compact the metrics into the prompt. Deliberately terse and complete: the
 * model must be able to answer from this block alone.
 */
export function buildAnalystContext(m: CapacityMetrics): string {
  const lines: string[] = [];

  lines.push("OUTCOMES");
  lines.push(`  attendance: ${m.attendancePercent ?? "n/a"}%`);
  lines.push(`  certification rate: ${m.completionPercent ?? "n/a"}%`);
  lines.push(`  assessment pass rate: ${m.passRatePercent ?? "n/a"}%`);
  lines.push(`  certified personnel: ${m.certifiedCount}`);
  lines.push(
    `  totals: ${m.totals.enrollments} enrolments, ${m.totals.attempts} attempts, ${m.totals.attendanceMarks} attendance marks`,
  );

  if (m.competencyGaps.length > 0) {
    lines.push("COMPETENCY SHORTFALLS (worst first)");
    for (const g of m.competencyGaps) {
      lines.push(
        `  ${g.skill} [${g.category}]: ${g.short} of ${g.expected} below required level (${g.gapPercent}%)`,
      );
    }
  }

  if (m.capabilityByCategory.length > 0) {
    lines.push("DOMAIN COVERAGE");
    for (const c of m.capabilityByCategory) {
      lines.push(`  ${c.category}: ${c.coveragePercent}% of required competencies held`);
    }
  }

  if (m.byDepartment.length > 0) {
    lines.push("BY DEPARTMENT");
    for (const d of m.byDepartment) {
      lines.push(
        `  ${d.department}: ${d.trainees} trainees, ${d.certified} certified (${d.completionPercent ?? 0}%)`,
      );
    }
  }

  if (m.byDomain.length > 0) {
    lines.push("BY DOMAIN");
    for (const d of m.byDomain) {
      lines.push(`  ${d.domain}: ${d.trainees} trainees across ${d.batches} courses`);
    }
  }

  lines.push("AVAILABLE CHARTS");
  for (const a of ANALYSES) lines.push(`  ${a.id} — ${a.about}`);

  return lines.join("\n");
}

/** Coerce a model reply into an answer, tolerating fenced or untidy JSON. */
export function parseAnalystReply(raw: string): { answer: string; chart: AnalysisId | null } {
  const ids = new Set<string>(ANALYSES.map((a) => a.id));
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as { answer?: unknown; chart?: unknown };
    const answer = typeof parsed.answer === "string" ? parsed.answer.trim() : "";
    const chart = typeof parsed.chart === "string" && ids.has(parsed.chart)
      ? (parsed.chart as AnalysisId)
      : null;
    if (answer) return { answer, chart };
  } catch {
    /* fall through — a model that ignored the format still said something useful */
  }

  return { answer: cleaned || "No answer was produced.", chart: null };
}

/**
 * Deterministic answer for when no model key is configured.
 *
 * Follows the established house norm (`lib/question-bank.ts`): a missing key
 * degrades the feature, never breaks it. The figures are the same real ones, so
 * this path is still correct — it is only less articulate.
 */
export function offlineAnswer(question: string, m: CapacityMetrics): AnalystAnswer {
  const q = question.toLowerCase();
  const worstGap = m.competencyGaps.find((g) => g.short > 0);
  const worstDomain = [...m.capabilityByCategory].sort(
    (a, b) => a.coveragePercent - b.coveragePercent,
  )[0];

  if (/depart|office|rmc|region/.test(q)) {
    const weakest = [...m.byDepartment]
      .filter((d) => d.trainees > 0)
      .sort((a, b) => (a.completionPercent ?? 0) - (b.completionPercent ?? 0))[0];
    return {
      answer: weakest
        ? `${weakest.department} has the lowest certification rate at ${weakest.completionPercent ?? 0}%, with ${weakest.certified} of ${weakest.trainees} trainees certified. The national rate is ${m.completionPercent ?? 0}%.`
        : "No department has any trainees recorded yet.",
      chart: "certified-by-department",
      offline: true,
    };
  }

  if (/domain|area|subject/.test(q)) {
    return {
      answer: worstDomain
        ? `${worstDomain.category} is the weakest domain, holding ${worstDomain.coveragePercent}% of the competencies its courses require.`
        : "No course has declared required competencies yet.",
      chart: "capability-by-domain",
      offline: true,
    };
  }

  if (/attend|pass|outcome|certif/.test(q)) {
    return {
      answer: `Attendance is ${m.attendancePercent ?? 0}%, the certification rate ${m.completionPercent ?? 0}%, and the assessment pass rate ${m.passRatePercent ?? 0}% across ${m.totals.attempts} attempts.`,
      chart: "outcomes",
      offline: true,
    };
  }

  return {
    answer: worstGap
      ? `The largest shortfall is ${worstGap.skill}, where ${worstGap.short} of ${worstGap.expected} trainees are below the level their course requires (${worstGap.gapPercent}%). ${worstDomain ? `${worstDomain.category} is the weakest domain overall at ${worstDomain.coveragePercent}% coverage.` : ""}`.trim()
      : "Every trainee meets the level their course requires.",
    chart: "competency-gaps",
    offline: true,
  };
}

/** Openers that demonstrate what the assistant can actually answer. */
export const ANALYST_SUGGESTIONS = [
  "Which competencies should we commission training for next?",
  "Which departments are falling behind on certification?",
  "Which operational domain is weakest?",
  "How are outcomes tracking overall?",
];

/**
 * Verify that every figure in the model's prose actually appears in the data we
 * gave it.
 *
 * The system prompt forbids inventing numbers, but a prompt is a request, not a
 * guarantee. This is the enforcement: extract every numeric token from the
 * answer and confirm each one occurs in the context block. Anything that does
 * not is surfaced to the reader rather than passed off as fact.
 *
 * Deliberately conservative about what counts as a figure — ordinals and small
 * counting words are not extracted, because the goal is to catch a fabricated
 * *statistic*, not to quibble with "three departments".
 */
export function verifyGrounding(
  answer: string,
  context: string,
): { grounded: boolean; unverified: string[] } {
  // Numbers, optionally decimal, optionally a percentage.
  const tokens = answer.match(/\d+(?:\.\d+)?%?/g) ?? [];
  const unverified: string[] = [];

  for (const raw of tokens) {
    if (unverified.includes(raw)) continue;
    // A bare small integer is almost always prose ("seven competencies",
    // "3D-Var"), not a claimed statistic — and checking it produces noise.
    const bare = raw.replace("%", "");
    if (!raw.endsWith("%") && Number(bare) <= 10 && !bare.includes(".")) continue;
    if (!context.includes(raw)) unverified.push(raw);
  }

  return { grounded: unverified.length === 0, unverified };
}
