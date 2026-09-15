import { describe, expect, it } from "vitest";
import {
  ANALYSES,
  buildAnalystContext,
  offlineAnswer,
  parseAnalystReply,
  verifyGrounding,
} from "@/lib/analyst";
import type { CapacityMetrics } from "@/lib/metrics";

const METRICS: CapacityMetrics = {
  attendancePercent: 78.9,
  completionPercent: 22.2,
  certifiedCount: 4,
  passRatePercent: 73.3,
  totals: { attendanceMarks: 71, enrollments: 18, attempts: 30 },
  byDepartment: [
    { department: "Satellite Meteorology", trainees: 2, certified: 2, completionPercent: 100 },
    { department: "Hydromet", trainees: 3, certified: 0, completionPercent: 0 },
  ],
  byDomain: [{ domain: "NWP Modeling", trainees: 5, batches: 1 }],
  competencyGaps: [
    {
      skill: "Data Assimilation (3D-Var/4D-Var)",
      category: "NWP Modeling",
      expected: 5,
      short: 5,
      gapPercent: 100,
    },
    {
      skill: "Doppler Radar Principles",
      category: "Radar & Telemetry",
      expected: 9,
      short: 3,
      gapPercent: 33,
    },
  ],
  capabilityByCategory: [
    { category: "NWP Modeling", coveragePercent: 0 },
    { category: "Radar & Telemetry", coveragePercent: 61 },
  ],
};

describe("buildAnalystContext", () => {
  it("carries every real figure the model is allowed to cite", () => {
    const ctx = buildAnalystContext(METRICS);
    expect(ctx).toContain("attendance: 78.9%");
    expect(ctx).toContain("certification rate: 22.2%");
    expect(ctx).toContain("Data Assimilation (3D-Var/4D-Var)");
    expect(ctx).toContain("5 of 5 below required level (100%)");
    expect(ctx).toContain("Hydromet: 3 trainees, 0 certified (0%)");
    expect(ctx).toContain("NWP Modeling: 0% of required competencies held");
  });

  it("lists the charts the model may choose from", () => {
    const ctx = buildAnalystContext(METRICS);
    for (const a of ANALYSES) expect(ctx).toContain(a.id);
  });

  it("omits empty sections rather than emitting bare headings", () => {
    const empty: CapacityMetrics = {
      ...METRICS,
      competencyGaps: [],
      capabilityByCategory: [],
      byDepartment: [],
      byDomain: [],
    };
    const ctx = buildAnalystContext(empty);
    expect(ctx).not.toContain("COMPETENCY SHORTFALLS");
    expect(ctx).not.toContain("BY DEPARTMENT");
    expect(ctx).toContain("OUTCOMES");
  });
});

describe("parseAnalystReply", () => {
  it("reads a clean JSON reply", () => {
    const r = parseAnalystReply('{"answer":"NWP is weakest.","chart":"capability-by-domain"}');
    expect(r.answer).toBe("NWP is weakest.");
    expect(r.chart).toBe("capability-by-domain");
  });

  it("tolerates a fenced code block", () => {
    const r = parseAnalystReply('```json\n{"answer":"Fine.","chart":null}\n```');
    expect(r.answer).toBe("Fine.");
    expect(r.chart).toBeNull();
  });

  it("rejects a chart id that is not on the allow-list", () => {
    const r = parseAnalystReply('{"answer":"Hi","chart":"drop-table-users"}');
    expect(r.chart).toBeNull();
    expect(r.answer).toBe("Hi");
  });

  it("keeps prose when the model ignores the JSON format", () => {
    const r = parseAnalystReply("NWP Modeling is the weakest domain.");
    expect(r.answer).toBe("NWP Modeling is the weakest domain.");
    expect(r.chart).toBeNull();
  });

  it("never returns an empty answer", () => {
    expect(parseAnalystReply("").answer).toBe("No answer was produced.");
    expect(parseAnalystReply('{"answer":"  ","chart":null}').answer).toBe(
      '{"answer":"  ","chart":null}',
    );
  });
});

describe("offlineAnswer", () => {
  it("answers a department question from real figures", () => {
    const r = offlineAnswer("Which departments are falling behind?", METRICS);
    expect(r.chart).toBe("certified-by-department");
    expect(r.answer).toContain("Hydromet");
    expect(r.answer).toContain("0%");
    expect(r.offline).toBe(true);
  });

  it("answers a domain question with the weakest domain", () => {
    const r = offlineAnswer("Which domain is weakest?", METRICS);
    expect(r.chart).toBe("capability-by-domain");
    expect(r.answer).toContain("NWP Modeling");
  });

  it("answers an outcomes question with the headline rates", () => {
    const r = offlineAnswer("How is attendance tracking?", METRICS);
    expect(r.chart).toBe("outcomes");
    expect(r.answer).toContain("78.9%");
    expect(r.answer).toContain("73.3%");
  });

  it("falls back to the largest competency shortfall", () => {
    const r = offlineAnswer("what should we do next", METRICS);
    expect(r.chart).toBe("competency-gaps");
    expect(r.answer).toContain("Data Assimilation (3D-Var/4D-Var)");
    expect(r.answer).toContain("5 of 5");
  });

  it("does not claim a shortfall when there is none", () => {
    const clean: CapacityMetrics = { ...METRICS, competencyGaps: [] };
    expect(offlineAnswer("what next", clean).answer).toContain("meets the level");
  });
});

describe("verifyGrounding", () => {
  const ctx = buildAnalystContext(METRICS);

  it("passes an answer whose figures all appear in the data", () => {
    const r = verifyGrounding(
      "Attendance is 78.9% and the certification rate is 22.2%. Data Assimilation is 100% short.",
      ctx,
    );
    expect(r.grounded).toBe(true);
    expect(r.unverified).toEqual([]);
  });

  it("catches a fabricated statistic", () => {
    const r = verifyGrounding("Attendance has risen to 91.4% this quarter.", ctx);
    expect(r.grounded).toBe(false);
    expect(r.unverified).toContain("91.4%");
  });

  it("catches a plausible-looking percentage that is simply not in the data", () => {
    expect(verifyGrounding("Coverage sits at 47%.", ctx).unverified).toEqual(["47%"]);
  });

  it("ignores small bare integers, which are prose rather than statistics", () => {
    // "3D-Var", "seven competencies", "4 departments" — not claimed figures.
    expect(verifyGrounding("Focus on 3D-Var across 4 areas.", ctx).grounded).toBe(true);
  });

  it("still checks large bare numbers, which are claims", () => {
    expect(verifyGrounding("There are 4200 trainees.", ctx).unverified).toEqual(["4200"]);
  });

  it("reports each unverified figure once", () => {
    const r = verifyGrounding("It moved 91.4% then 91.4% again.", ctx);
    expect(r.unverified).toEqual(["91.4%"]);
  });

  it("passes an answer with no figures at all", () => {
    expect(verifyGrounding("The data does not answer that question.", ctx).grounded).toBe(true);
  });
});
