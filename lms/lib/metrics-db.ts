import "server-only";
import { prisma } from "@/lib/prisma";
import { computeCapacityMetrics, type CapacityMetrics } from "@/lib/metrics";

export async function getCapacityMetrics(): Promise<CapacityMetrics> {
  const [attendanceRows, approvedEnrollments, certRows, attempts, traineeProfiles, batches, traineeSkills] =
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
          // What this course demands of the people on it — the two halves of a
          // competency gap.
          skillRequirements: {
            select: {
              minProficiency: true,
              skill: { select: { id: true, name: true, category: true } },
            },
          },
        },
      }),
      prisma.traineeSkill.findMany({ select: { traineeId: true, skillId: true, proficiency: true } }),
    ]);

  // (skill, trainee) pairs the active courses actually demand, paired with the
  // level that trainee currently holds. Built here rather than in the pure
  // function so the arithmetic stays testable without a database.
  const heldBy = new Map<string, number>();
  for (const ts of traineeSkills) heldBy.set(`${ts.traineeId}:${ts.skillId}`, ts.proficiency);

  const competency = batches.flatMap((b) =>
    b.skillRequirements.flatMap((req) =>
      b.enrollments.map((e) => ({
        skill: req.skill.name,
        category: req.skill.category,
        required: req.minProficiency,
        held: heldBy.get(`${e.studentId}:${req.skill.id}`) ?? null,
      })),
    ),
  );

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
    competency,
  });
}
