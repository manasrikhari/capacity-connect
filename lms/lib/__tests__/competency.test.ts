import { describe, expect, it } from "vitest";
import {
  MANDATORY_GAP_CAP,
  QUALIFIED_THRESHOLD,
  scoreTrainer,
  summariseByCategory,
  type Req,
  type TS,
} from "@/lib/competency";

describe("scoreTrainer", () => {
  it("perfect match: all MET, verified, senior → 100 and all MET", () => {
    const reqs: Req[] = [
      { skillId: "a", skillName: "Radar Ops", minProficiency: 3, weight: 2, isMandatory: true },
      { skillId: "b", skillName: "NWP", minProficiency: 4, weight: 1, isMandatory: true },
    ];
    const skills: TS[] = [
      { skillId: "a", proficiency: 5, isVerified: true },
      { skillId: "b", proficiency: 4, isVerified: true },
    ];

    const r = scoreTrainer(reqs, skills, 8);

    // raw 100 + 5 verified + 5 years = 110, clamped to 100.
    expect(r.matchScore).toBe(100);
    expect(r.isQualified).toBe(true);
    expect(r.missingMandatoryCount).toBe(0);
    expect(r.skillBreakdown.every((s) => s.status === "MET")).toBe(true);
  });

  it("non-mandatory partial: raw 88.9 + 2.5 years bonus → 91.4, qualified, skillB PARTIAL", () => {
    const reqs: Req[] = [
      { skillId: "a", skillName: "Skill A", minProficiency: 1, weight: 2, isMandatory: true },
      { skillId: "b", skillName: "Skill B", minProficiency: 3, weight: 1, isMandatory: false },
    ];
    const skills: TS[] = [
      { skillId: "a", proficiency: 1, isVerified: false },
      { skillId: "b", proficiency: 2, isVerified: false },
    ];

    // raw = (2*1 + 1*(2/3))/3 * 100 = 88.888.. ; +2.5 (years in [2,5)); no verified.
    const r = scoreTrainer(reqs, skills, 3);

    expect(r.matchScore).toBe(91.4);
    expect(r.isQualified).toBe(true);
    expect(r.missingMandatoryCount).toBe(0);
    const a = r.skillBreakdown.find((s) => s.skillName === "Skill A")!;
    const b = r.skillBreakdown.find((s) => s.skillName === "Skill B")!;
    expect(a.status).toBe("MET");
    expect(b.status).toBe("PARTIAL");
  });

  it("mandatory gap with high raw is capped to 45 and never qualified", () => {
    const reqs: Req[] = [
      // Mandatory but entirely missing.
      { skillId: "a", skillName: "Mandatory Missing", minProficiency: 3, weight: 1, isMandatory: true },
      // Heavy, fully met, verified — pushes raw high on its own.
      { skillId: "b", skillName: "Heavy Met", minProficiency: 2, weight: 5, isMandatory: false },
    ];
    const skills: TS[] = [
      { skillId: "b", proficiency: 2, isVerified: true },
    ];

    // raw = (0 + 5*1)/6 * 100 = 83.33 ; +5 verified +5 years = 93.33 (before cap).
    const r = scoreTrainer(reqs, skills, 10);

    expect(r.matchScore).toBe(MANDATORY_GAP_CAP); // 45
    expect(r.isQualified).toBe(false);
    expect(r.missingMandatoryCount).toBe(1);
    expect(
      r.skillBreakdown.find((s) => s.skillName === "Mandatory Missing")!.status
    ).toBe("MISSING");
  });

  it("empty trainer skills over non-empty reqs: raw 0, all MISSING, not qualified", () => {
    const reqs: Req[] = [
      { skillId: "a", skillName: "A", minProficiency: 2, weight: 1, isMandatory: true },
      { skillId: "b", skillName: "B", minProficiency: 3, weight: 1, isMandatory: false },
    ];

    const r = scoreTrainer(reqs, [], 1); // years < 2 so no bonus

    expect(r.matchScore).toBe(0);
    expect(r.isQualified).toBe(false);
    expect(r.missingMandatoryCount).toBe(1);
    expect(r.skillBreakdown.every((s) => s.status === "MISSING")).toBe(true);
  });

  it("empty requirements → zeroed result", () => {
    const r = scoreTrainer([], [{ skillId: "a", proficiency: 5, isVerified: true }], 9);
    expect(r).toEqual({
      matchScore: 0,
      isQualified: false,
      missingMandatoryCount: 0,
      skillBreakdown: [],
    });
  });

  it("QUALIFIED_THRESHOLD is the qualifying boundary", () => {
    expect(QUALIFIED_THRESHOLD).toBe(60);
  });
});

describe("summariseByCategory", () => {
  it("averages to 1 decimal place, counts, and sorts by category asc", () => {
    const out = summariseByCategory([
      { category: "Radar & Telemetry", proficiency: 4 },
      { category: "Radar & Telemetry", proficiency: 3 },
      { category: "Agro-Meteorology", proficiency: 2 },
      { category: "NWP Modeling", proficiency: 5 },
      { category: "NWP Modeling", proficiency: 4 },
      { category: "NWP Modeling", proficiency: 4 },
    ]);

    expect(out.map((c) => c.category)).toEqual([
      "Agro-Meteorology",
      "NWP Modeling",
      "Radar & Telemetry",
    ]);

    const nwp = out.find((c) => c.category === "NWP Modeling")!;
    expect(nwp.average).toBe(4.3); // (5+4+4)/3 = 4.333 → 4.3
    expect(nwp.count).toBe(3);
    expect(nwp.max).toBe(5);

    const radar = out.find((c) => c.category === "Radar & Telemetry")!;
    expect(radar.average).toBe(3.5); // (4+3)/2
    expect(radar.count).toBe(2);
  });

  it("empty input → empty array", () => {
    expect(summariseByCategory([])).toEqual([]);
  });
});
