import { describe, expect, it } from "vitest";
import {
  coerceRubric,
  coerceScores,
  gradeSubmission,
  isLate,
  parseRubric,
  rubricMax,
} from "@/lib/rubric";

const RUBRIC = [
  { label: "Analysis", maxPoints: 40 },
  { label: "Forecast reasoning", maxPoints: 40 },
  { label: "Communication", maxPoints: 20 },
];

describe("parseRubric", () => {
  it("parses label | points | guidance lines", () => {
    const r = parseRubric(
      "Analysis | 40 | Identifies the synoptic features\nCommunication | 20",
    );
    expect(r).toEqual([
      { label: "Analysis", maxPoints: 40, guidance: "Identifies the synoptic features" },
      { label: "Communication", maxPoints: 20, guidance: undefined },
    ]);
  });

  it("drops lines with no label or no positive points", () => {
    expect(parseRubric("| 40\nAnalysis | 0\nAnalysis | notanumber\n\n")).toEqual([]);
  });
});

describe("coerceRubric / coerceScores", () => {
  it("survives malformed stored Json", () => {
    expect(coerceRubric(null)).toEqual([]);
    expect(coerceRubric("nonsense")).toEqual([]);
    expect(coerceRubric([{ label: "", maxPoints: 10 }, { label: "OK", maxPoints: 0 }])).toEqual([]);
    expect(coerceRubric([{ label: "OK", maxPoints: 5 }])).toEqual([
      { label: "OK", maxPoints: 5, guidance: undefined },
    ]);
  });

  it("keeps only well-formed scores", () => {
    expect(coerceScores([{ label: "A", points: 3 }, { label: "", points: 1 }, 7])).toEqual([
      { label: "A", points: 3 },
    ]);
  });
});

describe("rubricMax", () => {
  it("sums the criteria", () => {
    expect(rubricMax(RUBRIC, 100)).toBe(100);
  });

  it("falls back when there is no rubric", () => {
    expect(rubricMax([], 50)).toBe(50);
  });
});

describe("gradeSubmission", () => {
  it("totals a fully graded submission", () => {
    const g = gradeSubmission(
      RUBRIC,
      [
        { label: "Analysis", points: 32 },
        { label: "Forecast reasoning", points: 30 },
        { label: "Communication", points: 15 },
      ],
      100,
    );
    expect(g.total).toBe(77);
    expect(g.percent).toBe(77);
    expect(g.isComplete).toBe(true);
    expect(g.missing).toEqual([]);
  });

  it("reports criteria the grader has not scored", () => {
    const g = gradeSubmission(RUBRIC, [{ label: "Analysis", points: 40 }], 100);
    expect(g.total).toBe(40);
    expect(g.isComplete).toBe(false);
    expect(g.missing).toEqual(["Forecast reasoning", "Communication"]);
  });

  it("clamps a criterion to its own maximum", () => {
    // A slip in the grading form must not push the submission past 100%.
    const g = gradeSubmission(RUBRIC, [{ label: "Communication", points: 999 }], 100);
    expect(g.total).toBe(20);
  });

  it("floors negative points at zero", () => {
    const g = gradeSubmission(RUBRIC, [{ label: "Analysis", points: -10 }], 100);
    expect(g.total).toBe(0);
  });

  it("ignores scores for criteria that are not in the rubric", () => {
    const g = gradeSubmission(RUBRIC, [{ label: "Neatness", points: 50 }], 100);
    expect(g.total).toBe(0);
    expect(g.missing).toHaveLength(3);
  });

  it("supports a holistic mark when there is no rubric", () => {
    const g = gradeSubmission([], [{ label: "Overall", points: 45 }], 50);
    expect(g.total).toBe(45);
    expect(g.max).toBe(50);
    expect(g.percent).toBe(90);
    expect(g.isComplete).toBe(true);
  });

  it("marks an ungraded holistic submission incomplete", () => {
    const g = gradeSubmission([], [], 50);
    expect(g.total).toBe(0);
    expect(g.isComplete).toBe(false);
    expect(g.missing).toEqual(["Overall"]);
  });

  it("never divides by zero", () => {
    expect(gradeSubmission([], [], 0).percent).toBe(0);
  });
});

describe("isLate", () => {
  const due = new Date("2026-06-15T00:00:00Z");

  it("is false with no deadline", () => {
    expect(isLate(new Date("2030-01-01"), null)).toBe(false);
  });

  it("compares against the deadline", () => {
    expect(isLate(new Date("2026-06-14T23:59:00Z"), due)).toBe(false);
    expect(isLate(new Date("2026-06-15T00:00:01Z"), due)).toBe(true);
  });
});
