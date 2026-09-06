import { describe, expect, it } from "vitest";
import {
  buildContingencyTable,
  colourRank,
  gradeForecastPerformance,
  scoreContingency,
  verifyForecasts,
  type ForecastCase,
} from "@/lib/forecast-verification";

describe("colourRank", () => {
  it("ranks IMD colours by ascending severity", () => {
    expect(colourRank("GREEN")).toBe(0);
    expect(colourRank("YELLOW")).toBe(1);
    expect(colourRank("ORANGE")).toBe(2);
    expect(colourRank("RED")).toBe(3);
  });
  it("is -1 for an unknown colour", () => {
    expect(colourRank("PURPLE")).toBe(-1);
  });
});

describe("scoreContingency", () => {
  it("computes the WMO categorical measures", () => {
    // hits=8 misses=2 falseAlarms=4 correctNegatives=86
    const s = scoreContingency({ hits: 8, misses: 2, falseAlarms: 4, correctNegatives: 86 });
    expect(s.pod).toBe(0.8); // 8/10
    expect(s.far).toBe(0.333); // 4/12
    expect(s.csi).toBe(0.571); // 8/14
    expect(s.bias).toBe(1.2); // 12/10
    expect(s.accuracy).toBe(0.94); // 94/100
    expect(s.sampleSize).toBe(100);
  });
  it("a perfect forecast scores POD 1, FAR 0, CSI 1", () => {
    const s = scoreContingency({ hits: 10, misses: 0, falseAlarms: 0, correctNegatives: 90 });
    expect(s.pod).toBe(1);
    expect(s.far).toBe(0);
    expect(s.csi).toBe(1);
    expect(s.accuracy).toBe(1);
  });
  it("uses the 0/0 = 0 convention when there are no events", () => {
    const s = scoreContingency({ hits: 0, misses: 0, falseAlarms: 0, correctNegatives: 20 });
    expect(s.pod).toBe(0);
    expect(s.far).toBe(0);
    expect(s.csi).toBe(0);
    expect(s.bias).toBe(0);
    expect(s.accuracy).toBe(1);
  });
});

describe("buildContingencyTable", () => {
  const cases: ForecastCase[] = [
    { forecast: "ORANGE", observed: "RED" }, // warned + occurred → hit
    { forecast: "GREEN", observed: "YELLOW" }, // not warned + occurred → miss
    { forecast: "RED", observed: "GREEN" }, // warned + not occurred → false alarm
    { forecast: "GREEN", observed: "GREEN" }, // not warned + not occurred → correct negative
  ];
  it("classifies at the default YELLOW threshold", () => {
    expect(buildContingencyTable(cases)).toEqual({
      hits: 1,
      misses: 1,
      falseAlarms: 1,
      correctNegatives: 1,
    });
  });
  it("raising the threshold to RED reclassifies borderline cases", () => {
    // Only observed==RED counts as an event; only forecast==RED counts as a warning.
    // The ORANGE→RED case, a hit at YELLOW, becomes a miss (ORANGE is below the RED bar).
    expect(buildContingencyTable(cases, "RED")).toEqual({
      hits: 0,
      misses: 1,
      falseAlarms: 1,
      correctNegatives: 2,
    });
  });
  it("skips pairs with an unknown colour", () => {
    const t = buildContingencyTable([{ forecast: "BLUE" as never, observed: "RED" }]);
    expect(t).toEqual({ hits: 0, misses: 0, falseAlarms: 0, correctNegatives: 0 });
  });
});

describe("gradeForecastPerformance", () => {
  const scoresWithCsi = (csi: number, sampleSize = 20) => ({
    pod: 0,
    far: 0,
    csi,
    bias: 0,
    accuracy: 0,
    sampleSize,
  });
  it("needs a minimum sample of 5 before any grade above 'Needs practice'", () => {
    expect(gradeForecastPerformance(scoresWithCsi(1, 4))).toBe("Needs practice");
  });
  it("grades on CSI bands", () => {
    expect(gradeForecastPerformance(scoresWithCsi(0.8))).toBe("Distinction");
    expect(gradeForecastPerformance(scoresWithCsi(0.6))).toBe("Merit");
    expect(gradeForecastPerformance(scoresWithCsi(0.4))).toBe("Pass");
    expect(gradeForecastPerformance(scoresWithCsi(0.39))).toBe("Needs practice");
  });
});

describe("verifyForecasts", () => {
  it("scores a realistic monsoon-nowcast run end to end", () => {
    const cases: ForecastCase[] = [
      { forecast: "RED", observed: "RED" },
      { forecast: "ORANGE", observed: "ORANGE" },
      { forecast: "YELLOW", observed: "GREEN" }, // false alarm
      { forecast: "GREEN", observed: "GREEN" },
      { forecast: "GREEN", observed: "ORANGE" }, // miss
      { forecast: "YELLOW", observed: "YELLOW" },
    ];
    const s = verifyForecasts(cases);
    // hits=3 (RED,ORANGE,YELLOW correct) misses=1 falseAlarms=1 correctNeg=1
    expect(s.pod).toBe(0.75);
    expect(s.csi).toBe(0.6);
    expect(gradeForecastPerformance(s)).toBe("Merit"); // 6 cases, CSI 0.6 → Merit
  });
});
