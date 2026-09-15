import crypto from "node:crypto";

/**
 * Competency Passport (Phase 5) — pure aggregation and signing helpers.
 *
 * Evidence accrues against named competencies from courses, assessments and
 * forecast drills. The passport is the roll-up (highest level per competency,
 * flagged verified when an examiner vouched) plus a signature so a printed copy
 * can be checked the same way a certificate is. No DB or server-only imports, so
 * the roll-up and the canonical signing string are unit-testable.
 */

export const PASSPORT_LEVELS = ["Novice", "Beginner", "Developing", "Proficient", "Expert"] as const;
export type PassportLevelName = (typeof PASSPORT_LEVELS)[number];

/** Name for a 1–5 level (out of range clamps into range). */
export function levelName(level: number): PassportLevelName {
  const i = Math.min(PASSPORT_LEVELS.length, Math.max(1, Math.round(level))) - 1;
  return PASSPORT_LEVELS[i]!;
}

export type EvidenceInput = {
  competencyId: string;
  competencyName: string;
  category: string;
  level: number;
  verified: boolean;
};

export type PassportCompetency = {
  competencyId: string;
  name: string;
  category: string;
  /** Highest level across all evidence for this competency. */
  level: number;
  levelName: PassportLevelName;
  /** True when the best-level evidence was examiner-verified. */
  verified: boolean;
  evidenceCount: number;
};

/**
 * Collapse many evidence rows into one entry per competency: the highest level
 * wins, and `verified` is true when any evidence at that top level was verified.
 */
export function rollUpEvidence(evidence: EvidenceInput[]): PassportCompetency[] {
  const byId = new Map<string, PassportCompetency>();
  for (const e of evidence) {
    const cur = byId.get(e.competencyId);
    if (!cur) {
      byId.set(e.competencyId, {
        competencyId: e.competencyId,
        name: e.competencyName,
        category: e.category,
        level: e.level,
        levelName: levelName(e.level),
        verified: e.verified,
        evidenceCount: 1,
      });
      continue;
    }
    cur.evidenceCount++;
    if (e.level > cur.level) {
      cur.level = e.level;
      cur.levelName = levelName(e.level);
      cur.verified = e.verified; // reset to the new top level's verification
    } else if (e.level === cur.level && e.verified) {
      cur.verified = true;
    }
  }
  return [...byId.values()].sort(
    (a, b) => b.level - a.level || a.name.localeCompare(b.name),
  );
}

export type PassportSummary = {
  competencies: PassportCompetency[];
  totalCount: number;
  verifiedCount: number;
  /** Mean level across competencies, 0 when none. */
  averageLevel: number;
};

export function summarisePassport(evidence: EvidenceInput[]): PassportSummary {
  const competencies = rollUpEvidence(evidence);
  const verifiedCount = competencies.filter((c) => c.verified).length;
  const averageLevel =
    competencies.length === 0
      ? 0
      : Math.round((competencies.reduce((s, c) => s + c.level, 0) / competencies.length) * 10) / 10;
  return { competencies, totalCount: competencies.length, verifiedCount, averageLevel };
}

export type PassportSignInput = {
  passportNumber: string;
  traineeId: string;
  issuedAt: Date;
  totalCount: number;
  verifiedCount: number;
};

/** Stable canonical string — order-independent of how evidence was fetched. */
export function passportCanonical(i: PassportSignInput): string {
  return `PASSPORT:${i.passportNumber}:${i.traineeId}:${i.issuedAt.toISOString()}:${i.totalCount}:${i.verifiedCount}`;
}

/** HMAC-SHA256 hex over the canonical passport string (same scheme as certificates). */
export function computePassportSignature(i: PassportSignInput, secret: string): string {
  return crypto.createHmac("sha256", secret).update(passportCanonical(i)).digest("hex");
}

/** Deterministic passport number from the trainee id (stable across renders). */
export function passportNumber(traineeId: string): string {
  const suffix = crypto.createHash("sha256").update(traineeId).digest("hex").slice(0, 8).toUpperCase();
  return `IMD-CP-${suffix}`;
}
