"use server";

import { revalidatePath } from "next/cache";
import { issueCertificate, revokeCertificate } from "@/lib/certificate-db";
import { notify } from "@/lib/notify";
import { evaluateEligibility, type Eligibility } from "@/lib/certificate";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export type RosterRow = {
  trainee: { id: string; name: string; designation: string | null };
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
 * Roster of every APPROVED trainee in the course, each with computed
 * eligibility and their certificate (if already issued).
 */
export async function getRosterEligibility(batchId: string): Promise<RosterRow[]> {
  const enrollments = await prisma.enrollment.findMany({
    where: { batchId, status: "APPROVED" },
    select: {
      status: true,
      student: { select: { id: true, name: true, profile: { select: { designation: true } } } },
    },
    orderBy: { student: { name: "asc" } },
  });

  const traineeIds = enrollments.map((e) => e.student.id);
  if (traineeIds.length === 0) return [];

  const [attempts, attendance, certificates] = await Promise.all([
    prisma.testAttempt.findMany({
      where: { batchId, studentId: { in: traineeIds } },
      select: { studentId: true, score: true, totalMarks: true },
    }),
    prisma.attendance.groupBy({
      by: ["studentId", "status"],
      where: { batchId, studentId: { in: traineeIds } },
      _count: true,
    }),
    prisma.certificate.findMany({
      where: { batchId, traineeId: { in: traineeIds } },
      select: {
        id: true,
        traineeId: true,
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
    const list = attemptsBy.get(a.studentId) ?? [];
    list.push({ score: a.score, totalMarks: a.totalMarks });
    attemptsBy.set(a.studentId, list);
  }
  const presentBy = new Map<string, number>();
  const absentBy = new Map<string, number>();
  for (const row of attendance) {
    const map = row.status === "PRESENT" ? presentBy : row.status === "ABSENT" ? absentBy : null;
    if (map) map.set(row.studentId, (map.get(row.studentId) ?? 0) + row._count);
  }
  const certBy = new Map(certificates.map((c) => [c.traineeId, c]));

  return enrollments.map((e) => {
    const id = e.student.id;
    const present = presentBy.get(id) ?? 0;
    const absent = absentBy.get(id) ?? 0;
    const eligibility = evaluateEligibility({
      enrollmentStatus: e.status,
      attempts: attemptsBy.get(id) ?? [],
      attendance: { present, total: present + absent },
    });
    const cert = certBy.get(id);
    return {
      trainee: { id, name: e.student.name ?? "Unnamed trainee", designation: e.student.profile?.designation ?? null },
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

export async function issueCertificateAction(traineeId: string) {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active course" };

  const result = await issueCertificate(batch.id, traineeId);
  if (!result.ok) return { error: result.reason };

  // Earning a credential and not being told about it is the kind of silence
  // this platform had everywhere before notifications existed.
  if (result.created) {
    await notify({
      userId: traineeId,
      kind: "certificate.issued",
      title: `Your certificate for ${batch.name} has been issued`,
      body: `Certificate ${result.certificate.certificateNumber}. Anyone can verify it at /verify.`,
      href: "/student/certificates",
    });
  }

  revalidatePath("/admin/certificates");
  revalidatePath("/student/certificates");
  return { success: true as const };
}

export async function revokeCertificateAction(id: string) {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active course" };

  const cert = await prisma.certificate.findUnique({ where: { id }, select: { batchId: true } });
  if (!cert || cert.batchId !== batch.id) return { error: "Certificate not found in this course" };

  await revokeCertificate(id);
  revalidatePath("/admin/certificates");
  revalidatePath("/student/certificates");
  return { success: true as const };
}
