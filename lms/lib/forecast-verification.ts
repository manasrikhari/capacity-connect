/**
 * Deterministic forecast verification (Phase 5 — the forecast-operations
 * simulator). A trainee issues IMD colour-coded warnings for a set of cases;
 * this scores them against what was observed using the standard categorical
 * verification measures (POD, FAR, CSI, frequency bias, accuracy) computed from
 * a 2×2 contingency table.
 *
 * Pure and defined for every input (division-by-zero collapses to 0 with a
 * documented convention), so the WMO-standard boundaries can be unit-tested and
 * the trainee's Competency Passport score is reproducible, never model-guessed.
 */

/** IMD's impact-based colour code, in ascending severity. */
export const IMD_COLOURS = ["GREEN", "YELLOW", "ORANGE", "RED"] as const;
export type ImdColour = (typeof IMD_COLOURS)[number];

/** Ordinal rank of a colour (GREEN=0 … RED=3); -1 for an unknown value. */
export function colourRank(colour: string): number {
  return (IMD_COLOURS as readonly string[]).indexOf(colour);
}

/**
 * A 2×2 contingency table for a yes/no event.
 * - hits: warned and it happened
 * - misses: not warned but it happened
 * - falseAlarms: warned but it did not happen
 * - correctNegatives: not warned and it did not happen
 */
export type ContingencyTable = {
  hits: number;
  misses: number;
  falseAlarms: number;
  correctNegatives: number;
};

export type ForecastScores = {
  /** Probability of detection: hits / (hits + misses). "Did we catch the events?" */
  pod: number;
  /** False alarm ratio: falseAlarms / (hits + falseAlarms). "How often did we cry wolf?" */
  far: number;
  /** Critical success index: hits / (hits + misses + falseAlarms). The headline skill score. */
  csi: number;
  /** Frequency bias: (hits + falseAlarms) / (hits + misses). >1 over-warns, <1 under-warns. */
  bias: number;
  /** Fraction of all cases called correctly. */
  accuracy: number;
  /** Total number of cases scored. */
  sampleSize: number;
};

const round3 = (n: number) => Math.round(n * 1000) / 1000;
/** Division with the verification convention that 0/0 = 0 (no events → no credit, no penalty). */
const safeDiv = (num: number, den: number) => (den === 0 ? 0 : round3(num / den));

/** Compute the categorical scores from a contingency table. */
export function scoreContingency(t: ContingencyTable): ForecastScores {
  const { hits, misses, falseAlarms, correctNegatives } = t;
  const total = hits + misses + falseAlarms + correctNegatives;
  return {
    pod: safeDiv(hits, hits + misses),
    far: safeDiv(falseAlarms, hits + falseAlarms),
    csi: safeDiv(hits, hits + misses + falseAlarms),
    bias: safeDiv(hits + falseAlarms, hits + misses),
    accuracy: safeDiv(hits + correctNegatives, total),
    sampleSize: total,
  };
}

export type ForecastCase = { forecast: ImdColour; observed: ImdColour };

/**
 * Colour-level accuracy, which the 2×2 table above deliberately cannot see.
 *
 * POD/FAR/CSI answer "did you warn at all", so issuing ORANGE for a RED event
 * scores as a clean hit — both are at or above the warning threshold. That is
 * correct categorical verification and wrong as a competency record: a trainee
 * who under-warned a red event would read 1.00 across the board. These measures
 * sit alongside it and score the colour actually issued.
 */
export type ColourScores = {
  /** Cases where the exact colour matched. */
  exact: number;
  /** Cases issued below the observed severity — the dangerous failure. */
  underWarned: number;
  /** Cases issued above the observed severity — the costly failure. */
  overWarned: number;
  /** exact / scored cases. */
  colourAccuracy: number;
  /**
   * Mean signed error in colour steps: negative means under-warning on average,
   * positive means over-warning. Zero is unbiased, not necessarily accurate.
   */
  meanWarningError: number;
};

export type ForecastVerification = ForecastScores & ColourScores;

/** Score the colour actually issued against the colour that was warranted. */
export function scoreColours(cases: ForecastCase[]): ColourScores {
  let exact = 0;
  let underWarned = 0;
  let overWarned = 0;
  let signedTotal = 0;
  let scored = 0;

  for (const c of cases) {
    const f = colourRank(c.forecast);
    const o = colourRank(c.observed);
    if (f < 0 || o < 0) continue;
    scored += 1;
    signedTotal += f - o;
    if (f === o) exact += 1;
    else if (f < o) underWarned += 1;
    else overWarned += 1;
  }

  return {
    exact,
    underWarned,
    overWarned,
    colourAccuracy: safeDiv(exact, scored),
    meanWarningError: safeDiv(signedTotal, scored),
  };
}

/**
 * Build a contingency table from paired colour-coded forecasts and
 * observations. An "event" occurs when the observed severity meets or exceeds
 * `warningThreshold` (default YELLOW, i.e. any warning-level weather); a
 * "warning" is a forecast at or above that threshold. Pairs with an
 * unrecognised colour on either side are skipped.
 */
export function buildContingencyTable(
  cases: ForecastCase[],
  warningThreshold: ImdColour = "YELLOW",
): ContingencyTable {
  const threshold = colourRank(warningThreshold);
  const table: ContingencyTable = { hits: 0, misses: 0, falseAlarms: 0, correctNegatives: 0 };

  for (const c of cases) {
    const f = colourRank(c.forecast);
    const o = colourRank(c.observed);
    if (f < 0 || o < 0) continue;
    const warned = f >= threshold;
    const occurred = o >= threshold;
    if (warned && occurred) table.hits++;
    else if (!warned && occurred) table.misses++;
    else if (warned && !occurred) table.falseAlarms++;
    else table.correctNegatives++;
  }
  return table;
}

/** One-shot: score a set of colour-coded cases at a warning threshold. */
export function verifyForecasts(
  cases: ForecastCase[],
  warningThreshold: ImdColour = "YELLOW",
): ForecastVerification {
  return {
    ...scoreContingency(buildContingencyTable(cases, warningThreshold)),
    ...scoreColours(cases),
  };
}

export type ForecastGrade = "Distinction" | "Merit" | "Pass" | "Needs practice";

/**
 * Grade a forecasting performance for the Competency Passport.
 *
 * CSI alone is not enough: it only asks whether a warning was issued at all, so
 * a trainee who answered ORANGE to every RED event would score a perfect 1.00.
 * The grade therefore averages CSI with colour accuracy, and no run containing
 * an under-warning can earn a Distinction — under-warning a hazard is the
 * failure a national met service cares most about.
 *
 * `colourAccuracy` is optional so a caller holding only a contingency table can
 * still grade; when it is absent the CSI-only behaviour applies.
 */
export function gradeForecastPerformance(
  scores: ForecastScores & Partial<ColourScores>,
): ForecastGrade {
  if (scores.sampleSize < 5) return "Needs practice";

  const skill =
    scores.colourAccuracy === undefined
      ? scores.csi
      : (scores.csi + scores.colourAccuracy) / 2;

  if (skill >= 0.8 && !scores.underWarned) return "Distinction";
  if (skill >= 0.6) return "Merit";
  if (skill >= 0.4) return "Pass";
  return "Needs practice";
}
