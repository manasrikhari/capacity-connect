import "server-only";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export type SpocContext = {
  userId: string;
  departments: { id: string; name: string; code: string | null; kind: string | null }[];
};

/**
 * Guard for the SPOC surface: the caller must be the nominated single point of
 * contact for at least one department. Being staff is not enough — nomination
 * is a delegated authority tied to a specific office, exactly as NPTEL's Local
 * Chapter model works.
 *
 * Deliberately not in a `"use server"` module: everything exported from one of
 * those becomes a client-callable endpoint, and this is an authorisation check.
 */
export async function getSpocContext(): Promise<SpocContext | null> {
  const session = await getSession();
  if (!session) return null;

  const departments = await prisma.department.findMany({
    where: { spocId: session.user.id },
    select: { id: true, name: true, code: true, kind: true },
    orderBy: { name: "asc" },
  });
  if (departments.length === 0) return null;

  return { userId: session.user.id, departments };
}

/**
 * Everything the coordinator dashboard shows, assembled outside the component.
 *
 * Kept here rather than inline in the page so the "is this invite expired?"
 * comparison happens in a plain async function — reading the clock during a
 * component's render is impure, and React's lint rules rightly reject it.
 */
export async function getSpocDashboard(ctx: SpocContext) {
  const now = new Date();
  const departmentIds = ctx.departments.map((d) => d.id);
  const departmentNames = ctx.departments.map((d) => d.name);

  const [courses, invites, cohort] = await Promise.all([
    prisma.batch.findMany({
      where: { status: "ACTIVE", teacher: { status: { not: "SUSPENDED" } } },
      orderBy: [{ startDate: { sort: "asc", nulls: "last" } }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.invite.findMany({
      where: { departmentId: { in: departmentIds }, acceptedAt: null },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        email: true,
        name: true,
        expiresAt: true,
        createdAt: true,
        batch: { select: { name: true } },
      },
    }),
    // The office's people, found through the department name on their profile —
    // the same field /platform already aggregates by.
    prisma.user.findMany({
      where: { role: "STUDENT", profile: { department: { in: departmentNames } } },
      orderBy: { name: "asc" },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        profile: { select: { designation: true, cadre: true } },
        _count: { select: { certificates: true } },
        enrollments: { where: { status: "APPROVED" }, select: { batchId: true } },
      },
    }),
  ]);

  return {
    courses,
    pendingInvites: invites.map((i) => ({ ...i, expired: i.expiresAt < now })),
    cohort,
  };
}
