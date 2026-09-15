import "server-only";
import { prisma } from "@/lib/prisma";
import {
  verifyForecasts,
  gradeForecastPerformance,
  IMD_COLOURS,
  type ForecastCase,
  type ForecastVerification,
  type ForecastGrade,
} from "@/lib/forecast-verification";

/**
 * Data layer for the forecast-operations drill (Phase 5). A trainee sees weather
 * cases from their courses (plus national cases with no batch), issues an IMD
 * colour-coded warning for each, and is scored deterministically by
 * lib/forecast-verification.ts. Enough attempts roll into Competency Passport
 * evidence.
 */

/** How many cases a trainee must attempt before the drill grants competency evidence. */
export const DRILL_EVIDENCE_MINIMUM = 5;
/** The competency the drill contributes to, self-provisioned on first use. */
const FORECAST_COMPETENCY = {
  code: "IMD-FORECAST-OPS",
  name: "Forecast operations (impact-based warnings)",
  category: "Disaster Warning",
} as const;

export type DrillCase = {
  id: string;
  title: string;
  description: string;
  hazard: string | null;
  region: string | null;
  imageUrl: string | null;
  /** The trainee's own answer so far, if any (never leaks the correct colour). */
  yourForecast: string | null;
};

async function approvedBatchIds(traineeId: string): Promise<string[]> {
  const rows = await prisma.enrollment.findMany({
    where: { studentId: traineeId, status: "APPROVED" },
    select: { batchId: true },
  });
  return rows.map((r) => r.batchId);
}

/** Cases visible to a trainee: national (no batch) + those in their approved courses. */
export async function getDrillForTrainee(traineeId: string): Promise<{
  cases: DrillCase[];
  scores: ForecastVerification;
  grade: ForecastGrade;
  attemptedCount: number;
}> {
  const batchIds = await approvedBatchIds(traineeId);
  const [cases, attempts] = await Promise.all([
    prisma.weatherCase.findMany({
      where: { OR: [{ batchId: null }, { batchId: { in: batchIds } }] },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        hazard: true,
        region: true,
        imageUrl: true,
      },
    }),
    prisma.weatherCaseAttempt.findMany({
      where: { traineeId },
      select: { weatherCaseId: true, forecastColour: true },
    }),
  ]);

  const byCase = new Map(attempts.map((a) => [a.weatherCaseId, a.forecastColour]));
  return {
    cases: cases.map((c) => ({ ...c, yourForecast: byCase.get(c.id) ?? null })),
    ...(await scoreTrainee(traineeId)),
  };
}

/** Recompute a trainee's forecast scores across every case they've attempted. */
export async function scoreTrainee(traineeId: string): Promise<{
  scores: ForecastVerification;
  grade: ForecastGrade;
  attemptedCount: number;
}> {
  const attempts = await prisma.weatherCaseAttempt.findMany({
    where: { traineeId },
    select: { forecastColour: true, weatherCase: { select: { correctColour: true } } },
  });
  const pairs: ForecastCase[] = attempts
    .filter(
      (a) =>
        (IMD_COLOURS as readonly string[]).includes(a.forecastColour) &&
        (IMD_COLOURS as readonly string[]).includes(a.weatherCase.correctColour),
    )
    .map((a) => ({
      forecast: a.forecastColour as ForecastCase["forecast"],
      observed: a.weatherCase.correctColour as ForecastCase["observed"],
    }));
  const scores = verifyForecasts(pairs);
  return { scores, grade: gradeForecastPerformance(scores), attemptedCount: attempts.length };
}

const gradeToLevel: Record<ForecastGrade, number> = {
  Distinction: 5,
  Merit: 4,
  Pass: 3,
  "Needs practice": 2,
};

/**
 * Record one forecast and, once the trainee has attempted enough cases, refresh
 * their forecast-operations competency evidence off the current CSI. Returns
 * whether the single call was correct plus the refreshed scores.
 */
export async function submitForecast(
  traineeId: string,
  caseId: string,
  colour: string,
): Promise<
  | { ok: false; error: string }
  | { ok: true; correct: boolean; scores: ForecastVerification; grade: ForecastGrade; attemptedCount: number }
> {
  if (!(IMD_COLOURS as readonly string[]).includes(colour)) {
    return { ok: false, error: "Pick a valid warning colour." };
  }

  const batchIds = await approvedBatchIds(traineeId);
  const weatherCase = await prisma.weatherCase.findFirst({
    where: { id: caseId, OR: [{ batchId: null }, { batchId: { in: batchIds } }] },
    select: { id: true, correctColour: true, batchId: true },
  });
  if (!weatherCase) return { ok: false, error: "This case isn't available to you." };

  await prisma.weatherCaseAttempt.upsert({
    where: { weatherCaseId_traineeId: { weatherCaseId: caseId, traineeId } },
    create: {
      weatherCaseId: caseId,
      traineeId,
      forecastColour: colour,
      isCorrect: colour === weatherCase.correctColour,
    },
    update: { forecastColour: colour, isCorrect: colour === weatherCase.correctColour },
  });

  const { scores, grade, attemptedCount } = await scoreTrainee(traineeId);

  if (attemptedCount >= DRILL_EVIDENCE_MINIMUM) {
    await refreshForecastEvidence(traineeId, weatherCase.batchId, scores, grade);
  }

  return { ok: true, correct: colour === weatherCase.correctColour, scores, grade, attemptedCount };
}

/** Get-or-create the forecast competency, then upsert the trainee's evidence for it. */
async function refreshForecastEvidence(
  traineeId: string,
  batchId: string | null,
  scores: ForecastVerification,
  grade: ForecastGrade,
): Promise<void> {
  const competency =
    (await prisma.competency.findUnique({ where: { code: FORECAST_COMPETENCY.code } })) ??
    (await prisma.competency
      .create({ data: FORECAST_COMPETENCY })
      .catch(() => prisma.competency.findUnique({ where: { code: FORECAST_COMPETENCY.code } })));
  if (!competency) return;

  const existing = await prisma.competencyEvidence.findFirst({
    where: { traineeId, competencyId: competency.id, source: "FORECAST_DRILL" },
    select: { id: true },
  });
  // Record the colour accuracy, not the CSI: CSI cannot see an under-warning,
  // so scoring evidence off it alone would credit a wrong colour as perfect.
  const under = scores.underWarned > 0 ? `, ${scores.underWarned} under-warned` : "";
  const data = {
    level: gradeToLevel[grade],
    score: Math.round(scores.colourAccuracy * 100),
    note: `Forecast drill — ${scores.exact}/${scores.sampleSize} exact colour, CSI ${scores.csi.toFixed(2)}${under} (${grade})`,
    batchId,
  };
  if (existing) {
    await prisma.competencyEvidence.update({ where: { id: existing.id }, data });
  } else {
    await prisma.competencyEvidence.create({
      data: { traineeId, competencyId: competency.id, source: "FORECAST_DRILL", ...data },
    });
  }
}
