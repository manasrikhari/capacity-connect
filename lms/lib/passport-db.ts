import "server-only";
import { prisma } from "@/lib/prisma";
import { certificateSecret } from "@/lib/certificate";
import {
  summarisePassport,
  passportNumber,
  computePassportSignature,
  type EvidenceInput,
  type PassportSummary,
} from "@/lib/passport";
import { scoreTrainee } from "@/lib/weather-case-db";
import type { ForecastScores } from "@/lib/forecast-verification";

/** Everything the /student/passport page renders — signed and verifiable. */
export type PassportData = {
  trainee: { id: string; name: string | null; organisation: string | null; cadre: string | null };
  summary: PassportSummary;
  certificates: {
    id: string;
    certificateNumber: string;
    courseName: string;
    grade: string | null;
    issueDate: Date;
  }[];
  forecast: { scores: ForecastScores; attemptedCount: number } | null;
  passportNumber: string;
  signature: string;
  issuedAt: Date;
};

export async function getPassportData(traineeId: string): Promise<PassportData> {
  const [user, evidence, certificates, forecast] = await Promise.all([
    prisma.user.findUnique({
      where: { id: traineeId },
      select: { id: true, name: true, profile: { select: { organisation: true, cadre: true } } },
    }),
    prisma.competencyEvidence.findMany({
      where: { traineeId },
      select: {
        level: true,
        verifiedAt: true,
        competency: { select: { id: true, name: true, category: true } },
      },
    }),
    prisma.certificate.findMany({
      where: { traineeId, status: "VALID" },
      orderBy: { issueDate: "desc" },
      select: {
        id: true,
        certificateNumber: true,
        grade: true,
        issueDate: true,
        batch: { select: { name: true } },
      },
    }),
    scoreTrainee(traineeId),
  ]);

  const evidenceInputs: EvidenceInput[] = evidence.map((e) => ({
    competencyId: e.competency.id,
    competencyName: e.competency.name,
    category: e.competency.category,
    level: e.level,
    verified: e.verifiedAt != null,
  }));
  const summary = summarisePassport(evidenceInputs);

  const issuedAt = new Date();
  const number = passportNumber(traineeId);
  const signature = computePassportSignature(
    {
      passportNumber: number,
      traineeId,
      issuedAt,
      totalCount: summary.totalCount,
      verifiedCount: summary.verifiedCount,
    },
    certificateSecret(),
  );

  return {
    trainee: {
      id: traineeId,
      name: user?.name ?? null,
      organisation: user?.profile?.organisation ?? null,
      cadre: user?.profile?.cadre ?? null,
    },
    summary,
    certificates: certificates.map((c) => ({
      id: c.id,
      certificateNumber: c.certificateNumber,
      courseName: c.batch.name,
      grade: c.grade,
      issueDate: c.issueDate,
    })),
    forecast: forecast.attemptedCount > 0 ? { scores: forecast.scores, attemptedCount: forecast.attemptedCount } : null,
    passportNumber: number,
    signature,
    issuedAt,
  };
}
