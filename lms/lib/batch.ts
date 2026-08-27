import { cache } from "react";
import { cookies } from "next/headers";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

const ACTIVE_BATCH_COOKIE = "active-batch-id";

const BATCH_SELECT = { id: true, name: true, grade: true } as const;

const TEACHER_BATCH_SELECT = { ...BATCH_SELECT, joinCode: true } as const;

// ── Student helpers ───────────────────────────────────────────────────────────

const NOT_SUSPENDED = { teacher: { status: { not: "SUSPENDED" as const } } };

export const getStudentEnrollments = cache(async (session: Session) => {
  return prisma.enrollment.findMany({
    where: { studentId: session.user.id, batch: NOT_SUSPENDED },
    include: { batch: { select: BATCH_SELECT } },
    orderBy: { createdAt: "asc" },
  });
});

export const getActiveStudentBatch = cache(async (session: Session) => {
  const cookieStore = await cookies();
  const cookieBatchId = cookieStore.get(ACTIVE_BATCH_COOKIE)?.value;

  if (cookieBatchId) {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_batchId: { studentId: session.user.id, batchId: cookieBatchId },
      },
      include: { batch: { select: { ...BATCH_SELECT, teacher: { select: { status: true } } } } },
    });
    if (enrollment?.status === "APPROVED" && enrollment.batch.teacher.status !== "SUSPENDED") {
      return enrollment.batch;
    }
  }

  const firstApproved = await prisma.enrollment.findFirst({
    where: { studentId: session.user.id, status: "APPROVED", batch: NOT_SUSPENDED },
    include: { batch: { select: BATCH_SELECT } },
    orderBy: { createdAt: "asc" },
  });

  return firstApproved?.batch ?? null;
});

export async function setActiveBatch(session: Session, batchId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_batchId: { studentId: session.user.id, batchId },
    },
    include: { batch: { select: { teacher: { select: { status: true } } } } },
  });

  if (!enrollment || enrollment.status !== "APPROVED" || enrollment.batch.teacher.status === "SUSPENDED") {
    throw new Error("No approved enrollment for this batch");
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BATCH_COOKIE, batchId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

// ── Teacher helpers ───────────────────────────────────────────────────────────

export async function getTeacherBatches(session: Session) {
  return prisma.batch.findMany({
    where: { teacherId: session.user.id, status: "ACTIVE" },
    select: BATCH_SELECT,
    orderBy: { createdAt: "asc" },
  });
}

export type TeacherHubBatch = {
  id: string;
  name: string;
  grade: string | null;
  joinCode: string;
  studentCount: number;
  pendingCount: number;
  testCount: number;
  isLive: boolean;
};

export const getTeacherHubData = cache(async (session: Session) => {
  const batches = await prisma.batch.findMany({
    where: { teacherId: session.user.id, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      grade: true,
      joinCode: true,
      _count: { select: { tests: true } },
      enrollments: { select: { status: true } },
      meetings: { where: { status: "LIVE" }, select: { id: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const mapped: TeacherHubBatch[] = batches.map((b) => ({
    id: b.id,
    name: b.name,
    grade: b.grade,
    joinCode: b.joinCode,
    studentCount: b.enrollments.filter((e) => e.status === "APPROVED").length,
    pendingCount: b.enrollments.filter((e) => e.status === "PENDING").length,
    testCount: b._count.tests,
    isLive: b.meetings.length > 0,
  }));

  return {
    batches: mapped,
    stats: {
      activeBatches: mapped.length,
      totalStudents: mapped.reduce((s, b) => s + b.studentCount, 0),
      pendingRequests: mapped.reduce((s, b) => s + b.pendingCount, 0),
    },
  };
});

export type StudentHubBatch = {
  id: string;
  enrollmentId: string;
  name: string;
  grade: string | null;
  teacherName: string | null;
  meetingCount: number;
  noteCount: number;
  testsDue: number;
  isLive: boolean;
};

export type StudentHubPending = {
  enrollmentId: string;
  name: string;
  grade: string | null;
  teacherName: string | null;
};

export const getStudentHubData = cache(async (session: Session) => {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: session.user.id, batch: NOT_SUSPENDED },
    select: {
      id: true,
      status: true,
      batch: {
        select: {
          id: true,
          name: true,
          grade: true,
          teacher: { select: { name: true } },
          _count: { select: { meetings: true, notes: true } },
          meetings: { where: { status: "LIVE" }, select: { id: true } },
          tests: { where: { isActive: true }, select: { id: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const approvedEnrollments = enrollments.filter((e) => e.status === "APPROVED");
  const pendingEnrollments = enrollments.filter((e) => e.status === "PENDING");

  const approvedBatchIds = approvedEnrollments.map((e) => e.batch.id);
  const attemptedTests =
    approvedBatchIds.length > 0
      ? await prisma.testAttempt.findMany({
          where: { studentId: session.user.id, batchId: { in: approvedBatchIds } },
          select: { testId: true },
        })
      : [];
  const attemptedSet = new Set(attemptedTests.map((a) => a.testId));

  const approved: StudentHubBatch[] = approvedEnrollments.map((e) => {
    const due = e.batch.tests.filter((t) => !attemptedSet.has(t.id)).length;
    return {
      id: e.batch.id,
      enrollmentId: e.id,
      name: e.batch.name,
      grade: e.batch.grade,
      teacherName: e.batch.teacher.name,
      meetingCount: e.batch._count.meetings,
      noteCount: e.batch._count.notes,
      testsDue: due,
      isLive: e.batch.meetings.length > 0,
    };
  });

  const pending: StudentHubPending[] = pendingEnrollments.map((e) => ({
    enrollmentId: e.id,
    name: e.batch.name,
    grade: e.batch.grade,
    teacherName: e.batch.teacher.name,
  }));

  const totalTestsDue = approved.reduce((s, b) => s + b.testsDue, 0);
  const liveCount = approved.filter((b) => b.isLive).length;

  return {
    approved,
    pending,
    stats: {
      joinedBatches: approved.length,
      liveNow: liveCount,
      testsToAttempt: totalTestsDue,
    },
  };
});

export const getActiveBatch = cache(async (session: Session) => {
  const cookieStore = await cookies();
  const cookieBatchId = cookieStore.get(ACTIVE_BATCH_COOKIE)?.value;

  if (cookieBatchId) {
    const batch = await prisma.batch.findFirst({
      where: { id: cookieBatchId, teacherId: session.user.id, status: "ACTIVE" },
      select: TEACHER_BATCH_SELECT,
    });
    if (batch) return batch;
  }

  const firstOwned = await prisma.batch.findFirst({
    where: { teacherId: session.user.id, status: "ACTIVE" },
    select: TEACHER_BATCH_SELECT,
    orderBy: { createdAt: "asc" },
  });

  return firstOwned ?? null;
});

export async function setActiveBatchForTeacher(session: Session, batchId: string) {
  const batch = await prisma.batch.findUnique({ where: { id: batchId } });

  if (!batch || batch.teacherId !== session.user.id) {
    throw new Error("You do not own this batch");
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BATCH_COOKIE, batchId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
