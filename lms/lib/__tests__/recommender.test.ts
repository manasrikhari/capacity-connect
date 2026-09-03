import { describe, expect, it } from "vitest";
import {
  failedSubjectMatchesBatch,
  rankCourses,
  scoreCourse,
  textMatchesDomain,
  type FailedAttempt,
  type RecBatch,
  type ScoreCourseInput,
} from "@/lib/recommender";

const radarBatch: RecBatch = {
  id: "b-radar",
  name: "Doppler Weather Radar Operations",
  subject: "Radar & Telemetry",
  department: "IMD",
  wmoTier: "BIP-M",
  level: "Intermediate",
};

const oneGapReq = [
  { skillId: "s1", skillName: "Radar Velocity Analysis", minProficiency: 4, weight: 1.5 },
];

function baseInput(overrides: Partial<ScoreCourseInput> = {}): ScoreCourseInput {
  return {
    batch: radarBatch,
    requirements: oneGapReq,
    traineeSkills: [{ skillId: "s1", proficiency: 2 }], // gap 2
    failedAttempts: [],
    profile: null,
    enrollmentStatus: null,
    ...overrides,
  };
}

describe("textMatchesDomain", () => {
  it("matches on the domain name and on synonyms, case-insensitively", () => {
    expect(textMatchesDomain("DWR Machilipatnam", "Radar & Telemetry")).toBe(true); // dwr synonym
    expect(textMatchesDomain("radar & telemetry site", "Radar & Telemetry")).toBe(true);
    expect(textMatchesDomain("NCMRWF Pune", "NWP Modeling")).toBe(true); // ncmrwf synonym
    expect(textMatchesDomain("Beach resort", "Radar & Telemetry")).toBe(false);
    expect(textMatchesDomain(null, "Radar & Telemetry")).toBe(false);
    expect(textMatchesDomain("radar", null)).toBe(false);
  });
});

describe("failedSubjectMatchesBatch", () => {
  const f = (over: Partial<FailedAttempt>): FailedAttempt => ({
    subject: "Radar Velocity",
    testTitle: "T",
    percent: 45,
    batchSubject: null,
    ...over,
  });
  it("matches by exact subject, keyword text, or batchSubject", () => {
    expect(failedSubjectMatchesBatch(f({ subject: "Radar Velocity" }), radarBatch)).toBe(true); // keyword radar
    expect(failedSubjectMatchesBatch(f({ subject: "Radar & Telemetry" }), radarBatch)).toBe(true); // exact
    expect(failedSubjectMatchesBatch(f({ subject: "Oceanography", batchSubject: "Radar & Telemetry" }), radarBatch)).toBe(true);
    expect(failedSubjectMatchesBatch(f({ subject: "Oceanography" }), radarBatch)).toBe(false);
  });
});

describe("scoreCourse", () => {
  it("S_gap = gap*weight, with the exact gap reason string", () => {
    const r = scoreCourse(baseInput());
    expect(r.sGap).toBe(3); // 2 * 1.5
    expect(r.sQuiz).toBe(1);
    expect(r.sDept).toBe(1);
    expect(r.score).toBe(3);
    expect(r.gaps).toEqual([
      { skillName: "Radar Velocity Analysis", required: 4, have: 2, gap: 2, weight: 1.5 },
    ]);
    expect(r.reasons).toContain(
      "Closes a 2-level gap in Radar Velocity Analysis (required 4, you have 2)"
    );
  });

  it("S_quiz 1.4 for a related failed subject → score 4.2, with quiz reason", () => {
    const r = scoreCourse(
      baseInput({
        failedAttempts: [
          { subject: "Radar Velocity", testTitle: "Radar Velocity De-aliasing", percent: 45, batchSubject: null },
        ],
      })
    );
    expect(r.sQuiz).toBe(1.4);
    expect(r.score).toBe(4.2); // 3 * 1.4
    expect(r.reasons).toContain("You scored 45% in Radar Velocity De-aliasing");
  });

  it("an unrelated failed subject leaves S_quiz at 1.0", () => {
    const r = scoreCourse(
      baseInput({
        failedAttempts: [
          { subject: "Oceanography", testTitle: "Ocean Currents", percent: 30, batchSubject: null },
        ],
      })
    );
    expect(r.sQuiz).toBe(1);
    expect(r.score).toBe(3);
    expect(r.reasons.some((x) => x.startsWith("You scored"))).toBe(false);
  });

  it("posting match → S_dept 1.3, posting + WMO reasons present", () => {
    const r = scoreCourse(
      baseInput({
        profile: { postingLocation: "DWR Machilipatnam", department: "NCMRWF" },
      })
    );
    expect(r.sDept).toBe(1.3);
    expect(r.score).toBe(3.9); // 3 * 1.3
    expect(r.reasons).toContain(
      "Your posting at DWR Machilipatnam matches this Radar & Telemetry course"
    );
    expect(r.reasons).toContain("Counts toward WMO BIP-M");
  });

  it("no gaps → S_gap base 1.0, so a dept-only hit yields score 1.3", () => {
    const r = scoreCourse(
      baseInput({
        traineeSkills: [{ skillId: "s1", proficiency: 5 }], // exceeds required 4 → no gap
        profile: { postingLocation: "Nowhere", department: "IMD" }, // dept match
      })
    );
    expect(r.gaps).toEqual([]);
    expect(r.sGap).toBe(1);
    expect(r.sDept).toBe(1.3);
    expect(r.score).toBe(1.3);
    expect(r.reasons).toContain("Offered by your department (IMD)");
  });

  it("PENDING enrollment surfaces its own reason", () => {
    const r = scoreCourse(baseInput({ enrollmentStatus: "PENDING" }));
    expect(r.enrollmentStatus).toBe("PENDING");
    expect(r.reasons).toContain("Enrollment requested — awaiting approval");
  });
});

describe("rankCourses", () => {
  it("sorts by score descending and respects the limit", () => {
    const strong = baseInput({
      batch: { ...radarBatch, id: "strong" },
      failedAttempts: [
        { subject: "Radar Velocity", testTitle: "X", percent: 45, batchSubject: null },
      ],
      profile: { postingLocation: "DWR Kolkata", department: "IMD" },
    }); // 3 * 1.4 * 1.3 = 5.46
    const mid = baseInput({ batch: { ...radarBatch, id: "mid" } }); // 3
    const weak = baseInput({
      batch: { ...radarBatch, id: "weak" },
      traineeSkills: [{ skillId: "s1", proficiency: 5 }], // no gap → 1.0
    }); // 1

    const ranked = rankCourses([mid, weak, strong]);
    expect(ranked.map((r) => r.batchId)).toEqual(["strong", "mid", "weak"]);

    const limited = rankCourses([mid, weak, strong], 2);
    expect(limited.map((r) => r.batchId)).toEqual(["strong", "mid"]);
    expect(limited).toHaveLength(2);
  });

  it("defaults the limit to 4", () => {
    const inputs = Array.from({ length: 6 }, (_, i) =>
      baseInput({ batch: { ...radarBatch, id: `b${i}` } })
    );
    expect(rankCourses(inputs)).toHaveLength(4);
  });
});
