import { describe, expect, it } from "vitest";
import {
  computePassportSignature,
  levelName,
  passportCanonical,
  passportNumber,
  rollUpEvidence,
  summarisePassport,
  type EvidenceInput,
} from "@/lib/passport";

const ev = (
  competencyId: string,
  level: number,
  verified = false,
  name = competencyId,
  category = "Radar & Telemetry",
): EvidenceInput => ({ competencyId, competencyName: name, category, level, verified });

describe("levelName", () => {
  it("maps 1–5 to names and clamps out-of-range", () => {
    expect(levelName(1)).toBe("Novice");
    expect(levelName(5)).toBe("Expert");
    expect(levelName(0)).toBe("Novice");
    expect(levelName(99)).toBe("Expert");
  });
});

describe("rollUpEvidence", () => {
  it("keeps the highest level per competency", () => {
    const rolled = rollUpEvidence([ev("a", 2), ev("a", 4), ev("a", 3)]);
    expect(rolled).toHaveLength(1);
    expect(rolled[0]!.level).toBe(4);
    expect(rolled[0]!.evidenceCount).toBe(3);
  });
  it("verified is true only when the top-level evidence was verified", () => {
    // top level 4 is unverified; a verified level-2 does not make the passport verified
    expect(rollUpEvidence([ev("a", 4, false), ev("a", 2, true)])[0]!.verified).toBe(false);
    // a verified row AT the top level flips it true
    expect(rollUpEvidence([ev("a", 4, false), ev("a", 4, true)])[0]!.verified).toBe(true);
  });
  it("sorts by level desc then name", () => {
    const rolled = rollUpEvidence([ev("z", 3, false, "Zeta"), ev("a", 5, false, "Alpha"), ev("b", 3, false, "Beta")]);
    expect(rolled.map((c) => c.name)).toEqual(["Alpha", "Beta", "Zeta"]);
  });
});

describe("summarisePassport", () => {
  it("counts verified competencies and averages the level", () => {
    const s = summarisePassport([ev("a", 4, true), ev("b", 2, false), ev("c", 3, true)]);
    expect(s.totalCount).toBe(3);
    expect(s.verifiedCount).toBe(2);
    expect(s.averageLevel).toBe(3); // (4+2+3)/3
  });
  it("is empty and zero for no evidence", () => {
    expect(summarisePassport([])).toEqual({
      competencies: [],
      totalCount: 0,
      verifiedCount: 0,
      averageLevel: 0,
    });
  });
});

describe("signing", () => {
  const input = {
    passportNumber: "IMD-CP-DEADBEEF",
    traineeId: "trainee-1",
    issuedAt: new Date("2026-09-07T00:00:00.000Z"),
    totalCount: 5,
    verifiedCount: 3,
  };
  it("canonical string is stable and structured", () => {
    expect(passportCanonical(input)).toBe(
      "PASSPORT:IMD-CP-DEADBEEF:trainee-1:2026-09-07T00:00:00.000Z:5:3",
    );
  });
  it("signature is deterministic and secret-dependent", () => {
    const a = computePassportSignature(input, "s3cret");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(computePassportSignature(input, "s3cret")).toBe(a);
    expect(computePassportSignature(input, "other")).not.toBe(a);
  });
  it("passportNumber is deterministic per trainee", () => {
    expect(passportNumber("trainee-1")).toBe(passportNumber("trainee-1"));
    expect(passportNumber("trainee-1")).toMatch(/^IMD-CP-[0-9A-F]{8}$/);
    expect(passportNumber("trainee-2")).not.toBe(passportNumber("trainee-1"));
  });
});
