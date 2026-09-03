import "server-only";
import { prisma } from "@/lib/prisma";
import { computeCapacityMetrics, type CapacityMetrics } from "@/lib/metrics";

export async function getCapacityMetrics(): Promise<CapacityMetrics> {
  const [attendanceRows, approvedEnrollments, certRows, attempts, traineeProfiles, batches] =
    await Promise.all([
      prisma.attendance.groupBy({ by: ["status"], _count: true }),
      prisma.enrollment.count({ where: { status: "APPROVED" } }),
      prisma.certificate.findMany({
        where: { status: "VALID" },
        select: { traineeId: true, trainee: { select: { profile: { select: { department: true } } } } },
      }),
      prisma.testAttempt.findMany({ select: { score: true, totalMarks: true } }),
      prisma.profile.findMany({
        where: { user: { role: "STUDENT" } },
        select: { userId: true, department: true },
      }),
      prisma.batch.findMany({
        where: { status: "ACTIVE" },
        select: {
          id: true,
          subject: true,
          enrollments: { where: { status: "APPROVED" }, select: { studentId: true } },
        },
      }),
    ]);

  const certifiedTrainees = new Set(certRows.map((c) => c.traineeId)).size;

  // Trainees + certified per department.
  const deptTrainees = new Map<string, number>();
  for (const p of traineeProfiles) {
    const dept = p.department ?? "Unassigned";
    deptTrainees.set(dept, (deptTrainees.get(dept) ?? 0) + 1);
  }
  const deptCertified = new Map<string, Set<string>>();
  for (const c of certRows) {
    const dept = c.trainee.profile?.department ?? "Unassigned";
    const set = deptCertified.get(dept) ?? new Set<string>();
    set.add(c.traineeId);
    deptCertified.set(dept, set);
  }
  const departments = [...deptTrainees.entries()].map(([department, trainees]) => ({
    department,
    trainees,
    certified: deptCertified.get(department)?.size ?? 0,
  }));

  // Distinct approved trainees + batch count per operational domain (Batch.subject).
  const domainTrainees = new Map<string, Set<string>>();
  const domainBatches = new Map<string, number>();
  for (const b of batches) {
    const domain = b.subject ?? "General";
    domainBatches.set(domain, (domainBatches.get(domain) ?? 0) + 1);
    const set = domainTrainees.get(domain) ?? new Set<string>();
    for (const e of b.enrollments) set.add(e.studentId);
    domainTrainees.set(domain, set);
  }
  const domains = [...domainBatches.entries()].map(([domain, batchCount]) => ({
    domain,
    trainees: domainTrainees.get(domain)?.size ?? 0,
    batches: batchCount,
  }));

  return computeCapacityMetrics({
    attendance: attendanceRows.map((r) => ({ status: r.status, count: r._count })),
    approvedEnrollments,
    certifiedTrainees,
    attempts,
    departments,
    domains,
  });
}
