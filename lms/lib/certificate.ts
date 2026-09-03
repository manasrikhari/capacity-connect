// Cryptographic certificate core for Capacity Connect (SIH 26075).
// Pure functions only — NO `server-only` import, so prisma/seed.ts can use it.
// The HMAC payload order matches backend/src/services/certificate.service.ts.
import crypto from "node:crypto";

export type Grade = "Distinction" | "Merit" | "Pass";

export const PASS_RATIO = 0.6;
export const MIN_ATTENDANCE = 75;

const DEV_SECRET = "capacity-connect-dev-cert-secret-0001";
let warnedDevSecret = false;

/** HMAC signing secret. Requires CERTIFICATE_SECRET (>=16) in production. */
export function certificateSecret(): string {
  const s = process.env.CERTIFICATE_SECRET?.trim();
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("CERTIFICATE_SECRET must be set (>= 16 chars) in production");
  }
  if (!warnedDevSecret) {
    warnedDevSecret = true;
    console.warn("[certificate] CERTIFICATE_SECRET unset — using a fixed dev secret");
  }
  return DEV_SECRET;
}

/** Human-facing number, e.g. "IMD-CC-2026-000042". */
export function generateCertificateNumber(
  now: Date = new Date(),
  rng: () => number = () => crypto.randomInt(0, 1_000_000),
): string {
  const n = Math.abs(Math.floor(rng())) % 1_000_000;
  return `IMD-CC-${now.getFullYear()}-${String(n).padStart(6, "0")}`;
}

export type HashInput = {
  certificateNumber: string;
  traineeId: string;
  batchId: string;
  issueDate: Date;
};

function canonical(i: HashInput): string {
  return `${i.certificateNumber}:${i.traineeId}:${i.batchId}:${i.issueDate.toISOString()}`;
}

/** HMAC-SHA256 hex (64 chars) over the canonical credential string. */
export function computeVerificationHash(i: HashInput, secret: string = certificateSecret()): string {
  return crypto.createHmac("sha256", secret).update(canonical(i)).digest("hex");
}

/** Constant-time hex-string comparison. */
export function hashesEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function gradeFor(percent: number): Grade {
  if (percent >= 85) return "Distinction";
  if (percent >= 70) return "Merit";
  return "Pass";
}

export type Eligibility =
  | { ok: true; bestPercent: number; grade: Grade; attendancePercent: number | null }
  | { ok: false; reason: string };

/** APPROVED enrollment + a passing attempt + (if marked) >= 75% attendance. */
export function evaluateEligibility(i: {
  enrollmentStatus: string | null;
  attempts: { score: number; totalMarks: number }[];
  attendance: { present: number; total: number };
}): Eligibility {
  if (i.enrollmentStatus !== "APPROVED") {
    return { ok: false, reason: "Enrolment must be approved before a certificate can be issued." };
  }
  if (i.attempts.length === 0) {
    return { ok: false, reason: "Complete at least one assessment to become eligible." };
  }
  const bestPercent = Math.max(
    ...i.attempts.map((a) => (a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0)),
  );
  if (bestPercent < PASS_RATIO * 100) {
    return {
      ok: false,
      reason: `Best assessment score is ${Math.round(bestPercent)}%; a minimum of ${Math.round(
        PASS_RATIO * 100,
      )}% is required.`,
    };
  }
  const attendancePercent =
    i.attendance.total > 0 ? (i.attendance.present / i.attendance.total) * 100 : null;
  if (attendancePercent !== null && attendancePercent < MIN_ATTENDANCE) {
    return {
      ok: false,
      reason: `Attendance is ${Math.round(attendancePercent)}%; a minimum of ${MIN_ATTENDANCE}% is required.`,
    };
  }
  return {
    ok: true,
    bestPercent: Math.round(bestPercent),
    grade: gradeFor(bestPercent),
    attendancePercent: attendancePercent === null ? null : Math.round(attendancePercent),
  };
}
