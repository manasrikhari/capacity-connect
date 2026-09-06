import { describe, expect, it } from "vitest";
import {
  coerceEligibilityRule,
  evaluateEligibility,
  hasEligibilityRules,
  type EligibilityRule,
} from "@/lib/eligibility";

// IMD Forecaster's Training Course: science graduate w/ Physics & Mathematics,
// a completed Intermediate course, and 5 years in the Met-A cadre.
const FORECASTER_RULE: EligibilityRule = {
  requiredQualifications: ["Physics", "Mathematics"],
  qualificationLabel: "Science graduate with Physics and Mathematics",
  requiredCadre: "Met-A",
  minYearsExperience: 5,
  prerequisiteCourseIds: ["course-intermediate"],
};

describe("hasEligibilityRules", () => {
  it("is false for null / empty rules", () => {
    expect(hasEligibilityRules(null)).toBe(false);
    expect(hasEligibilityRules({})).toBe(false);
    expect(hasEligibilityRules({ prerequisiteCourseIds: [] })).toBe(false);
  });
  it("is true when any constraint is present", () => {
    expect(hasEligibilityRules({ requiredCadre: "Met-A" })).toBe(true);
    expect(hasEligibilityRules({ minYearsExperience: 0 })).toBe(true);
  });
});

describe("evaluateEligibility — non-applicable", () => {
  it("reports not applicable when there are no rules", () => {
    const res = evaluateEligibility({}, {});
    expect(res.applicable).toBe(false);
    expect(res.totalCount).toBe(0);
    expect(res.allMet).toBe(false);
  });
});

describe("evaluateEligibility — each rule kind", () => {
  it("qualification keywords: met only when all keywords appear", () => {
    const met = evaluateEligibility(
      { requiredQualifications: ["Physics", "Mathematics"] },
      { qualifications: [{ degree: "B.Sc Physics, Mathematics & Chemistry" }] },
    );
    expect(met.checks[0].met).toBe(true);

    const unmet = evaluateEligibility(
      { requiredQualifications: ["Physics", "Mathematics"] },
      { qualifications: [{ degree: "B.Sc Physics" }] },
    );
    expect(unmet.checks[0].met).toBe(false);
    expect(unmet.checks[0].detail).toContain("Mathematics");
  });

  it("cadre: case-insensitive exact match", () => {
    expect(evaluateEligibility({ requiredCadre: "Met-A" }, { cadre: "met-a" }).allMet).toBe(true);
    expect(evaluateEligibility({ requiredCadre: "Met-A" }, { cadre: "Met-B" }).allMet).toBe(false);
    expect(evaluateEligibility({ requiredCadre: "Met-A" }, {}).allMet).toBe(false);
  });

  it("experience: met at or above the threshold", () => {
    expect(evaluateEligibility({ minYearsExperience: 5 }, { yearsExperience: 5 }).allMet).toBe(true);
    expect(evaluateEligibility({ minYearsExperience: 5 }, { yearsExperience: 4.9 }).allMet).toBe(false);
    expect(evaluateEligibility({ minYearsExperience: 5 }, {}).allMet).toBe(false);
  });

  it("prerequisite: one check per course, labelled by name", () => {
    const res = evaluateEligibility(
      { prerequisiteCourseIds: ["c1"] },
      { completedCourseIds: [] },
      { c1: "Intermediate Training Course" },
    );
    expect(res.checks[0].met).toBe(false);
    expect(res.checks[0].detail).toContain("Intermediate Training Course");

    const met = evaluateEligibility(
      { prerequisiteCourseIds: ["c1"] },
      { completedCourseIds: ["c1"] },
      { c1: "Intermediate Training Course" },
    );
    expect(met.allMet).toBe(true);
  });
});

describe("evaluateEligibility — partially-met summary", () => {
  it("reports 3 of 4 when only the prerequisite is missing", () => {
    const res = evaluateEligibility(
      FORECASTER_RULE,
      {
        cadre: "Met-A",
        yearsExperience: 8,
        qualifications: [{ degree: "M.Sc Physics with Mathematics" }],
        completedCourseIds: [], // missing the Intermediate course
      },
      { "course-intermediate": "Intermediate Training Course" },
    );
    expect(res.totalCount).toBe(4);
    expect(res.metCount).toBe(3);
    expect(res.allMet).toBe(false);
    const unmet = res.checks.find((c) => !c.met);
    expect(unmet?.key).toBe("prerequisite:course-intermediate");
  });

  it("reports all 4 met for a fully-qualified trainee", () => {
    const res = evaluateEligibility(
      FORECASTER_RULE,
      {
        cadre: "Met-A",
        yearsExperience: 6,
        qualifications: [{ degree: "B.Sc Physics, Mathematics" }],
        completedCourseIds: ["course-intermediate"],
      },
      { "course-intermediate": "Intermediate Training Course" },
    );
    expect(res.metCount).toBe(4);
    expect(res.allMet).toBe(true);
  });
});

describe("coerceEligibilityRule", () => {
  it("drops garbage and keeps typed fields", () => {
    const rule = coerceEligibilityRule({
      requiredCadre: "Met-A",
      minYearsExperience: 5,
      requiredQualifications: ["Physics", 42],
      prerequisiteCourseIds: "nope",
      junk: true,
    });
    expect(rule.requiredCadre).toBe("Met-A");
    expect(rule.minYearsExperience).toBe(5);
    expect(rule.requiredQualifications).toEqual(["Physics"]);
    expect(rule.prerequisiteCourseIds).toBeUndefined();
  });
  it("returns an empty rule for null / non-object", () => {
    expect(coerceEligibilityRule(null)).toEqual({});
    expect(coerceEligibilityRule("x")).toEqual({});
  });
});
