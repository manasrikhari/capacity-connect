"use server";

import { revalidatePath } from "next/cache";
import { evaluateEligibility, type Eligibility } from "@/lib/certificate";
import { issueCertificate } from "@/lib/certificate-db";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export type CourseEligibilityRow = {
  batch: { id: string; name: string; subject: string | null; wmoTier: string | null };
  eligibility: Eligibility;
  certificate: {
    id: string;
    certificateNumber: string;
    grade: string | null;
    scorePercent: number | null;
    status: string;
    issueDate: Date;
    verificationHash: string;
  } | null;
};

/**
 * Every approved enrolment for a trainee, each with computed certificate
 * eligibility and their certificate (if already issued). Mirrors the admin
 * roster helper but scoped to one trainee across all their courses.
 */
export async function getTraineeCourseEligibility(traineeId: string): Promise<CourseEligibilityRow[]> {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId: traineeId,
      status: "APPROVED",
      batch: { teacher: { status: { not: "SUSPENDED" } } },
    },
    select: {
      status: true,
      batch: { select: { id: true, name: true, subject: true, wmoTier: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const batchIds = enrollments.map((e) => e.batch.id);
  if (batchIds.length === 0) return [];

  const [attempts, attendance, certificates] = await Promise.all([
    prisma.testAttempt.findMany({
      where: { studentId: traineeId, batchId: { in: batchIds } },
      select: { batchId: true, score: true, totalMarks: true },
    }),
    prisma.attendance.groupBy({
      by: ["batchId", "status"],
      where: { studentId: traineeId, batchId: { in: batchIds } },
      _count: true,
    }),
    prisma.certificate.findMany({
      where: { traineeId, batchId: { in: batchIds } },
      select: {
        id: true,
        batchId: true,
        certificateNumber: true,
        grade: true,
        scorePercent: true,
        status: true,
        issueDate: true,
        verificationHash: true,
      },
    }),
  ]);

  const attemptsBy = new Map<string, { score: number; totalMarks: number }[]>();
  for (const a of attempts) {
    const list = attemptsBy.get(a.batchId) ?? [];
    list.push({ score: a.score, totalMarks: a.totalMarks });
    attemptsBy.set(a.batchId, list);
  }
  const presentBy = new Map<string, number>();
  const absentBy = new Map<string, number>();
  for (const row of attendance) {
    const map = row.status === "PRESENT" ? presentBy : row.status === "ABSENT" ? absentBy : null;
    if (map) map.set(row.batchId, (map.get(row.batchId) ?? 0) + row._count);
  }
  const certBy = new Map(certificates.map((c) => [c.batchId, c]));

  return enrollments.map((e) => {
    const id = e.batch.id;
    const present = presentBy.get(id) ?? 0;
    const absent = absentBy.get(id) ?? 0;
    const eligibility = evaluateEligibility({
      enrollmentStatus: e.status,
      attempts: attemptsBy.get(id) ?? [],
      attendance: { present, total: present + absent },
    });
    const cert = certBy.get(id);
    return {
      batch: e.batch,
      eligibility,
      certificate: cert
        ? {
            id: cert.id,
            certificateNumber: cert.certificateNumber,
            grade: cert.grade,
            scorePercent: cert.scorePercent,
            status: cert.status,
            issueDate: cert.issueDate,
            verificationHash: cert.verificationHash,
          }
        : null,
    };
  });
}

export async function claimCertificateAction(batchId: string) {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") return { error: "Sign in as a trainee to claim." };

  const result = await issueCertificate(batchId, session.user.id);
  if (!result.ok) return { error: result.reason };

  revalidatePath("/student/certificates");
  return { success: true as const };
}
