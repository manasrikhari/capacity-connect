import "server-only";
import { prisma } from "@/lib/prisma";
import {
  computeVerificationHash,
  evaluateEligibility,
  generateCertificateNumber,
  hashesEqual,
} from "@/lib/certificate";

/** Issue a certificate if the trainee is eligible (idempotent per course). */
export async function issueCertificate(batchId: string, traineeId: string) {
  const existing = await prisma.certificate.findUnique({
    where: { batchId_traineeId: { batchId, traineeId } },
  });
  if (existing) return { ok: true as const, certificate: existing, created: false };

  const [enrollment, attempts, attendance, batch, trainee] = await Promise.all([
    prisma.enrollment.findUnique({
      where: { studentId_batchId: { studentId: traineeId, batchId } },
    }),
    prisma.testAttempt.findMany({
      where: { studentId: traineeId, batchId },
      select: { score: true, totalMarks: true },
    }),
    prisma.attendance.groupBy({
      by: ["status"],
      where: { studentId: traineeId, batchId },
      _count: true,
    }),
    prisma.batch.findUnique({ where: { id: batchId } }),
    prisma.user.findUnique({ where: { id: traineeId }, include: { profile: true } }),
  ]);

  const present = attendance.find((a) => a.status === "PRESENT")?._count ?? 0;
  const absent = attendance.find((a) => a.status === "ABSENT")?._count ?? 0;

  const eligibility = evaluateEligibility({
    enrollmentStatus: enrollment?.status ?? null,
    attempts,
    attendance: { present, total: present + absent },
  });
  if (!eligibility.ok) return { ok: false as const, reason: eligibility.reason };
  if (!batch || !trainee) return { ok: false as const, reason: "Course or trainee not found." };

  // Retry a few times for a unique human-facing number.
  let certificateNumber = generateCertificateNumber();
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.certificate.findUnique({ where: { certificateNumber } });
    if (!clash) break;
    certificateNumber = generateCertificateNumber();
  }

  const issueDate = new Date();
  const verificationHash = computeVerificationHash({
    certificateNumber,
    traineeId,
    batchId,
    issueDate,
  });

  const certificate = await prisma.certificate.create({
    data: {
      certificateNumber,
      verificationHash,
      batchId,
      traineeId,
      issueDate,
      grade: eligibility.grade,
      scorePercent: eligibility.bestPercent,
      status: "VALID",
      metadata: {
        batchName: batch.name,
        domain: batch.subject,
        wmoTier: batch.wmoTier,
        recipientName: trainee.name,
        attendancePercent: eligibility.attendancePercent,
      },
    },
  });

  // Certification implies competency at each required skill level — record it,
  // but never lower a level the trainee already holds.
  const reqs = await prisma.batchSkillRequirement.findMany({ where: { batchId } });
  for (const r of reqs) {
    const current = await prisma.traineeSkill.findUnique({
      where: { traineeId_skillId: { traineeId, skillId: r.skillId } },
    });
    if (!current) {
      await prisma.traineeSkill.create({
        data: {
          traineeId,
          skillId: r.skillId,
          proficiency: r.minProficiency,
          source: `CERTIFICATE:${batchId}`,
        },
      });
    } else if (current.proficiency < r.minProficiency) {
      await prisma.traineeSkill.update({
        where: { id: current.id },
        data: { proficiency: r.minProficiency, source: `CERTIFICATE:${batchId}` },
      });
    }
  }

  return { ok: true as const, certificate, created: true };
}

/** Look up a certificate by number (upper-cased) or hash (lower-cased). */
export async function verifyCertificate(query: string) {
  const q = query.trim();
  if (!q) return { found: false as const };

  const cert = await prisma.certificate.findFirst({
    where: {
      OR: [{ certificateNumber: q.toUpperCase() }, { verificationHash: q.toLowerCase() }],
    },
    include: { trainee: { include: { profile: true } }, batch: true },
  });
  if (!cert) return { found: false as const };

  const expected = computeVerificationHash({
    certificateNumber: cert.certificateNumber,
    traineeId: cert.traineeId,
    batchId: cert.batchId,
    issueDate: cert.issueDate,
  });
  const isTamperFree = hashesEqual(expected, cert.verificationHash);
  const isValid = isTamperFree && cert.status === "VALID";

  return {
    found: true as const,
    isValid,
    isTamperFree,
    certificate: cert,
    trainee: {
      name: cert.trainee.name,
      designation: cert.trainee.profile?.designation ?? null,
      department: cert.trainee.profile?.department ?? null,
    },
    batch: { name: cert.batch.name, subject: cert.batch.subject, wmoTier: cert.batch.wmoTier },
  };
}

export async function revokeCertificate(id: string) {
  return prisma.certificate.update({ where: { id }, data: { status: "REVOKED" } });
}
