import "server-only";
import { randomBytes } from "node:crypto";
import type { Role } from "@/app/generated/prisma/enums";
import { notify } from "@/lib/notify";
import { prisma } from "@/lib/prisma";

/** How long a nomination stays open before it must be re-sent. */
export const INVITE_TTL_DAYS = 30;

/** 32 bytes of urlsafe randomness — guessing one must not be feasible. */
export function newInviteToken(): string {
  return randomBytes(24).toString("base64url");
}

export type NominationInput = {
  email: string;
  name?: string | null;
  cadre?: string | null;
  designation?: string | null;
};

export type NominationOutcome = {
  email: string;
  status: "invited" | "enrolled" | "already" | "invalid";
  detail?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Nominate people onto a course.
 *
 * Two paths, because a nominee may or may not already have an account:
 *
 *  - **Existing user** — enrol them directly and tell them. Their office
 *    vouched for them, so the enrolment is APPROVED rather than PENDING; that
 *    is the whole point of nomination and is what removes the approval wait.
 *  - **New user** — store an `Invite` carrying the course, department, cadre
 *    and designation, so accepting it creates an account with the profile
 *    already correct instead of an empty one.
 *
 * Idempotent per email: re-sending refreshes the existing invite's expiry
 * rather than piling up rows.
 */
export async function nominate({
  people,
  batchId,
  departmentId,
  invitedById,
  role = "STUDENT",
}: {
  people: NominationInput[];
  batchId: string | null;
  departmentId: string | null;
  invitedById: string;
  role?: Role;
}): Promise<NominationOutcome[]> {
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000);

  const batch = batchId
    ? await prisma.batch.findUnique({ where: { id: batchId }, select: { id: true, name: true, slug: true } })
    : null;

  const results: NominationOutcome[] = [];

  for (const person of people) {
    const email = person.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      results.push({ email: person.email, status: "invalid", detail: "Not a valid email address" });
      continue;
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    if (existing) {
      if (!batch) {
        results.push({ email, status: "already", detail: "Already has an account" });
        continue;
      }
      if (existing.role !== "STUDENT") {
        results.push({ email, status: "invalid", detail: "Staff accounts cannot be nominated" });
        continue;
      }

      const prior = await prisma.enrollment.findUnique({
        where: { studentId_batchId: { studentId: existing.id, batchId: batch.id } },
        select: { status: true },
      });
      if (prior?.status === "APPROVED") {
        results.push({ email, status: "already", detail: "Already enrolled" });
        continue;
      }

      await prisma.enrollment.upsert({
        where: { studentId_batchId: { studentId: existing.id, batchId: batch.id } },
        create: { studentId: existing.id, batchId: batch.id, status: "APPROVED" },
        update: { status: "APPROVED" },
      });

      // Fill in the department the nomination came from, without overwriting
      // anything the person has already set for themselves.
      if (departmentId) await applyDepartment(existing.id, departmentId, person);

      await notify({
        userId: existing.id,
        kind: "nomination.enrolled",
        title: `You have been nominated for ${batch.name}`,
        body: "Your office enrolled you. The course is on your dashboard.",
        href: "/student",
      });

      results.push({ email, status: "enrolled" });
      continue;
    }

    const token = newInviteToken();
    await prisma.invite.upsert({
      where: { token },
      create: {
        token,
        email,
        name: person.name?.trim() || null,
        cadre: person.cadre?.trim() || null,
        designation: person.designation?.trim() || null,
        role,
        batchId: batch?.id ?? null,
        departmentId,
        invitedById,
        expiresAt,
      },
      update: {},
    });

    results.push({ email, status: "invited" });
  }

  return results;
}

async function applyDepartment(userId: string, departmentId: string, person: NominationInput) {
  const dept = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { name: true },
  });
  if (!dept) return;
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { department: true, cadre: true, designation: true },
  });
  await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      department: dept.name,
      cadre: person.cadre?.trim() || null,
      designation: person.designation?.trim() || null,
    },
    update: {
      department: profile?.department ?? dept.name,
      cadre: profile?.cadre ?? (person.cadre?.trim() || null),
      designation: profile?.designation ?? (person.designation?.trim() || null),
    },
  });
}

/**
 * Redeem an invite for a signed-in user: enrol them, and seed the profile
 * fields their office already knew. Returns where to send them next.
 */
export async function acceptInvite(
  token: string,
  userId: string,
  userEmail: string,
): Promise<{ ok: true; href: string; courseName: string | null } | { ok: false; reason: string }> {
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { batch: { select: { id: true, name: true, status: true } }, department: true },
  });

  if (!invite) return { ok: false, reason: "This invitation link is not valid." };
  if (invite.acceptedAt) return { ok: false, reason: "This invitation has already been used." };
  if (invite.expiresAt < new Date()) return { ok: false, reason: "This invitation has expired." };
  if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
    return {
      ok: false,
      reason: `This invitation was sent to ${invite.email}. Sign in with that account to accept it.`,
    };
  }

  if (invite.batch && invite.batch.status === "ACTIVE") {
    await prisma.enrollment.upsert({
      where: { studentId_batchId: { studentId: userId, batchId: invite.batch.id } },
      create: { studentId: userId, batchId: invite.batch.id, status: "APPROVED" },
      update: { status: "APPROVED" },
    });
  }

  await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      department: invite.department?.name ?? null,
      cadre: invite.cadre,
      designation: invite.designation,
    },
    update: {
      // Never clobber what the person has already filled in themselves.
      department: invite.department?.name ?? undefined,
      cadre: invite.cadre ?? undefined,
      designation: invite.designation ?? undefined,
    },
  });

  await prisma.user.update({ where: { id: userId }, data: { onboarded: true } });
  await prisma.invite.update({ where: { token }, data: { acceptedAt: new Date() } });

  return {
    ok: true,
    href: invite.batch ? `/student?joined=${encodeURIComponent(invite.batch.name)}` : "/student",
    courseName: invite.batch?.name ?? null,
  };
}
