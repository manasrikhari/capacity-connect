import { describe, expect, it } from "vitest";
import { computeCapabilityByCategory, computeCompetencyGaps } from "@/lib/metrics";

const row = (skill: string, required: number, held: number | null, category = "Radar & Telemetry") => ({
  skill,
  category,
  required,
  held,
});

describe("computeCompetencyGaps", () => {
  it("is empty when no course demands anything", () => {
    expect(computeCompetencyGaps([])).toEqual([]);
  });

  it("counts a trainee below the required level as short", () => {
    const [g] = computeCompetencyGaps([row("Doppler Radar Principles", 3, 2)]);
    expect(g.expected).toBe(1);
    expect(g.short).toBe(1);
    expect(g.gapPercent).toBe(100);
  });

  it("treats meeting the level exactly as met, not short", () => {
    const [g] = computeCompetencyGaps([row("Doppler Radar Principles", 3, 3)]);
    expect(g.short).toBe(0);
    expect(g.gapPercent).toBe(0);
  });

  it("counts a missing record as short — absence of evidence is not competence", () => {
    const [g] = computeCompetencyGaps([row("Z-R Relationship", 3, null)]);
    expect(g.short).toBe(1);
    expect(g.gapPercent).toBe(100);
  });

  it("aggregates several trainees on one skill", () => {
    const gaps = computeCompetencyGaps([
      row("Nowcasting", 3, 4),
      row("Nowcasting", 3, 1),
      row("Nowcasting", 3, null),
      row("Nowcasting", 3, 3),
    ]);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].expected).toBe(4);
    expect(gaps[0].short).toBe(2);
    expect(gaps[0].gapPercent).toBe(50);
  });

  it("orders by the worst shortfall first — that is what gets commissioned", () => {
    const gaps = computeCompetencyGaps([
      row("Well covered", 3, 4),
      row("Well covered", 3, 4),
      row("Badly short", 4, 1),
      row("Badly short", 4, 1),
      row("Half short", 3, 3),
      row("Half short", 3, 1),
    ]);
    expect(gaps.map((g) => g.skill)).toEqual(["Badly short", "Half short", "Well covered"]);
    expect(gaps.map((g) => g.gapPercent)).toEqual([100, 50, 0]);
  });

  it("breaks a percentage tie by the number of people affected", () => {
    const gaps = computeCompetencyGaps([
      row("Affects one", 3, 1),
      row("Affects two", 3, 1),
      row("Affects two", 3, 1),
    ]);
    expect(gaps.map((g) => g.skill)).toEqual(["Affects two", "Affects one"]);
  });

  it("keeps each skill's category for grouping", () => {
    const gaps = computeCompetencyGaps([row("Satellite Winds", 3, 1, "Satellite Meteorology")]);
    expect(gaps[0].category).toBe("Satellite Meteorology");
  });
});

describe("computeCapabilityByCategory", () => {
  it("is empty with no demand", () => {
    expect(computeCapabilityByCategory([])).toEqual([]);
  });

  it("reports the share of demanded competencies actually held", () => {
    const out = computeCapabilityByCategory([
      row("A", 3, 4, "Radar & Telemetry"),
      row("B", 3, 1, "Radar & Telemetry"),
      row("C", 3, 3, "NWP Modeling"),
    ]);
    expect(out).toEqual([
      { category: "NWP Modeling", coveragePercent: 100 },
      { category: "Radar & Telemetry", coveragePercent: 50 },
    ]);
  });

  it("counts a missing record as not held", () => {
    expect(computeCapabilityByCategory([row("A", 3, null)])[0].coveragePercent).toBe(0);
  });

  it("sorts categories by name so the radar's axes stay stable between loads", () => {
    const out = computeCapabilityByCategory([
      row("A", 1, 1, "Zulu"),
      row("B", 1, 1, "Alpha"),
    ]);
    expect(out.map((c) => c.category)).toEqual(["Alpha", "Zulu"]);
  });
});
