import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * National (ministry) roll-ups (Phase 6): the SPOC/nomination programme seen
 * from the top, and course feedback aggregated across the whole platform. Both
 * are de-identified — the ministry sees offices and distributions, never a
 * named trainee's individual rating.
 */

export type DepartmentRow = {
  id: string;
  name: string;
  code: string | null;
  kind: string | null;
  spocName: string | null;
  invitesSent: number;
  invitesAccepted: number;
  cohortSize: number;
  certified: number;
  activeEnrollments: number;
};

/** Per-office nomination and certification picture — the SPOC national view. */
export async function getDepartmentOverview(): Promise<DepartmentRow[]> {
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      code: true,
      kind: true,
      spoc: { select: { name: true } },
      _count: { select: { invites: true } },
    },
  });
  if (departments.length === 0) return [];

  // Accepted invites per department (one grouped query).
  const acceptedByDept = new Map<string, number>();
  const accepted = await prisma.invite.groupBy({
    by: ["departmentId"],
    where: { departmentId: { not: null }, acceptedAt: { not: null } },
    _count: { _all: true },
  });
  for (const a of accepted) if (a.departmentId) acceptedByDept.set(a.departmentId, a._count._all);

  // Cohort + certification are keyed on the profile's department NAME (the same
  // field /platform and /spoc aggregate by), so resolve per name.
  const rows = await Promise.all(
    departments.map(async (d) => {
      const cohort = await prisma.user.findMany({
        where: { role: "STUDENT", profile: { department: d.name } },
        select: {
          _count: { select: { certificates: true, enrollments: true } },
          enrollments: { where: { status: "APPROVED" }, select: { id: true } },
        },
      });
      const certified = cohort.reduce((s, u) => s + (u._count.certificates > 0 ? 1 : 0), 0);
      const activeEnrollments = cohort.reduce((s, u) => s + u.enrollments.length, 0);
      return {
        id: d.id,
        name: d.name,
        code: d.code,
        kind: d.kind,
        spocName: d.spoc?.name ?? null,
        invitesSent: d._count.invites,
        invitesAccepted: acceptedByDept.get(d.id) ?? 0,
        cohortSize: cohort.length,
        certified,
        activeEnrollments,
      };
    }),
  );
  return rows;
}

export type NationalFeedbackCourse = {
  batchId: string;
  courseName: string;
  department: string | null;
  responses: number;
  overall: number | null;
  content: number | null;
  trainer: number | null;
  infrastructure: number | null;
};

export type NationalFeedback = {
  totalResponses: number;
  averages: { overall: number | null; content: number | null; trainer: number | null; infrastructure: number | null };
  distribution: number[]; // index 0..4 → 1..5 stars
  courses: NationalFeedbackCourse[];
};

function mean(values: (number | null | undefined)[]): number | null {
  const nums = values.filter((v): v is number => typeof v === "number");
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10;
}

/** All course feedback, aggregated per course and platform-wide. De-identified. */
export async function getNationalFeedback(): Promise<NationalFeedback> {
  const feedbacks = await prisma.feedback.findMany({
    select: {
      overallRating: true,
      contentRating: true,
      trainerRating: true,
      infrastructureRating: true,
      batch: { select: { id: true, name: true, subject: true, department: true } },
    },
  });

  const distribution = [0, 0, 0, 0, 0];
  const byCourse = new Map<string, { name: string; department: string | null; rows: typeof feedbacks }>();
  for (const f of feedbacks) {
    if (f.overallRating >= 1 && f.overallRating <= 5) distribution[f.overallRating - 1] += 1;
    const key = f.batch.id;
    if (!byCourse.has(key)) {
      byCourse.set(key, {
        name: [f.batch.subject, f.batch.name].filter(Boolean).join(" · ") || f.batch.name,
        department: f.batch.department,
        rows: [],
      });
    }
    byCourse.get(key)!.rows.push(f);
  }

  const courses: NationalFeedbackCourse[] = [...byCourse.entries()]
    .map(([batchId, v]) => ({
      batchId,
      courseName: v.name,
      department: v.department,
      responses: v.rows.length,
      overall: mean(v.rows.map((r) => r.overallRating)),
      content: mean(v.rows.map((r) => r.contentRating)),
      trainer: mean(v.rows.map((r) => r.trainerRating)),
      infrastructure: mean(v.rows.map((r) => r.infrastructureRating)),
    }))
    .sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));

  return {
    totalResponses: feedbacks.length,
    averages: {
      overall: mean(feedbacks.map((f) => f.overallRating)),
      content: mean(feedbacks.map((f) => f.contentRating)),
      trainer: mean(feedbacks.map((f) => f.trainerRating)),
      infrastructure: mean(feedbacks.map((f) => f.infrastructureRating)),
    },
    distribution,
    courses,
  };
}
