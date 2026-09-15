import { describe, expect, it } from "vitest";
import { computeCapacityMetrics, type MetricsRows } from "@/lib/metrics";

function baseRows(overrides: Partial<MetricsRows> = {}): MetricsRows {
  return {
    attendance: [],
    approvedEnrollments: 0,
    certifiedTrainees: 0,
    attempts: [],
    departments: [],
    domains: [],
  competency: [],
    ...overrides,
  };
}

describe("computeCapacityMetrics", () => {
  it("attendancePercent = PRESENT/(PRESENT+ABSENT)*100 to 1dp", () => {
    const m = computeCapacityMetrics(
      baseRows({
        attendance: [
          { status: "PRESENT", count: 3 },
          { status: "ABSENT", count: 1 },
        ],
      })
    );
    expect(m.attendancePercent).toBe(75);
    expect(m.totals.attendanceMarks).toBe(4);
  });

  it("completionPercent = certified/approved*100 to 1dp", () => {
    const m = computeCapacityMetrics(
      baseRows({ approvedEnrollments: 8, certifiedTrainees: 2 })
    );
    expect(m.completionPercent).toBe(25);
    expect(m.certifiedCount).toBe(2);
  });

  it("passRatePercent counts attempts scoring >= 50%", () => {
    // 6/10 pass, 4/10 fail, 9/10 pass -> 2 of 3 -> 66.7
    const m = computeCapacityMetrics(
      baseRows({
        attempts: [
          { score: 6, totalMarks: 10 },
          { score: 4, totalMarks: 10 },
          { score: 9, totalMarks: 10 },
        ],
      })
    );
    expect(m.passRatePercent).toBe(66.7);
    expect(m.totals.attempts).toBe(3);
  });

  it("treats exactly 50% as a pass (>= boundary)", () => {
    const m = computeCapacityMetrics(
      baseRows({ attempts: [{ score: 5, totalMarks: 10 }] })
    );
    expect(m.passRatePercent).toBe(100);
  });

  it("returns nulls (never NaN) for all-empty rows", () => {
    const m = computeCapacityMetrics(baseRows());
    expect(m.attendancePercent).toBeNull();
    expect(m.completionPercent).toBeNull();
    expect(m.passRatePercent).toBeNull();
    expect(Number.isNaN(m.attendancePercent as unknown as number)).toBe(false);
    expect(m.certifiedCount).toBe(0);
    expect(m.byDepartment).toEqual([]);
    expect(m.byDomain).toEqual([]);
  });

  it("sorts departments by trainees desc and computes per-dept completion", () => {
    const m = computeCapacityMetrics(
      baseRows({
        departments: [
          { department: "Radar", trainees: 5, certified: 1 },
          { department: "NWP", trainees: 20, certified: 10 },
          { department: "Satellite", trainees: 0, certified: 0 },
        ],
      })
    );
    expect(m.byDepartment.map((d) => d.department)).toEqual([
      "NWP",
      "Radar",
      "Satellite",
    ]);
    expect(m.byDepartment[0].completionPercent).toBe(50);
    expect(m.byDepartment[1].completionPercent).toBe(20);
    // 0 trainees -> null, never NaN
    expect(m.byDepartment[2].completionPercent).toBeNull();
  });

  it("passes through domains sorted by trainees desc", () => {
    const m = computeCapacityMetrics(
      baseRows({
        domains: [
          { domain: "A", trainees: 3, batches: 1 },
          { domain: "B", trainees: 9, batches: 2 },
        ],
      })
    );
    expect(m.byDomain.map((d) => d.domain)).toEqual(["B", "A"]);
  });
});
