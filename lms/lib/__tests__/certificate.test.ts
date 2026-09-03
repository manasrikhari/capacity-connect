import { describe, expect, it } from "vitest";
import {
  computeVerificationHash,
  evaluateEligibility,
  generateCertificateNumber,
  gradeFor,
  hashesEqual,
} from "@/lib/certificate";

const base = {
  certificateNumber: "IMD-CC-2026-000042",
  traineeId: "t1",
  batchId: "b1",
  issueDate: new Date("2026-01-15T00:00:00.000Z"),
};

describe("computeVerificationHash", () => {
  it("is deterministic, 64 hex chars, and secret-bound", () => {
    const a = computeVerificationHash(base, "secret-secret-secret");
    const b = computeVerificationHash(base, "secret-secret-secret");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(computeVerificationHash(base, "other-secret-1234")).not.toBe(a);
  });

  it("breaks when traineeId or issueDate is tampered", () => {
    const good = computeVerificationHash(base, "k".repeat(20));
    const tId = computeVerificationHash({ ...base, traineeId: "t2" }, "k".repeat(20));
    const tDate = computeVerificationHash(
      { ...base, issueDate: new Date("2026-01-16T00:00:00.000Z") },
      "k".repeat(20),
    );
    expect(hashesEqual(good, tId)).toBe(false);
    expect(hashesEqual(good, tDate)).toBe(false);
    expect(hashesEqual(good, good)).toBe(true);
  });
});

describe("generateCertificateNumber", () => {
  it("formats year + 6-digit padded sequence from injected rng", () => {
    expect(generateCertificateNumber(new Date("2026-06-01"), () => 42)).toBe("IMD-CC-2026-000042");
    expect(generateCertificateNumber(new Date("2026-06-01"), () => 483920)).toBe(
      "IMD-CC-2026-483920",
    );
  });
});

describe("gradeFor", () => {
  it("uses 85/70 thresholds", () => {
    expect(gradeFor(85)).toBe("Distinction");
    expect(gradeFor(84.9)).toBe("Merit");
    expect(gradeFor(70)).toBe("Merit");
    expect(gradeFor(69)).toBe("Pass");
  });
});

describe("evaluateEligibility", () => {
  it("requires an approved enrolment", () => {
    const r = evaluateEligibility({
      enrollmentStatus: "PENDING",
      attempts: [{ score: 9, totalMarks: 10 }],
      attendance: { present: 8, total: 10 },
    });
    expect(r.ok).toBe(false);
  });

  it("requires a 60% best score", () => {
    const r = evaluateEligibility({
      enrollmentStatus: "APPROVED",
      attempts: [{ score: 5, totalMarks: 10 }],
      attendance: { present: 0, total: 0 },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain("60%");
  });

  it("requires 75% attendance when marks exist", () => {
    const r = evaluateEligibility({
      enrollmentStatus: "APPROVED",
      attempts: [{ score: 9, totalMarks: 10 }],
      attendance: { present: 7, total: 10 },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain("75%");
  });

  it("passes with best 90% and no attendance marks", () => {
    const r = evaluateEligibility({
      enrollmentStatus: "APPROVED",
      attempts: [
        { score: 6, totalMarks: 10 },
        { score: 9, totalMarks: 10 },
      ],
      attendance: { present: 0, total: 0 },
    });
    expect(r).toEqual({ ok: true, bestPercent: 90, grade: "Distinction", attendancePercent: null });
  });
});
