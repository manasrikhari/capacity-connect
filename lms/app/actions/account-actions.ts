"use server";

import { signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function getProfileData() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      plan: true,
      createdAt: true,
      _count: {
        select: {
          ownedBatches: true,
          enrollments: true,
          testAttempts: true,
        },
      },
      ownedBatches: {
        select: { id: true, name: true, subject: true, joinCode: true },
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      enrollments: {
        select: {
          status: true,
          batch: { select: { name: true, subject: true } },
        },
        where: { status: "APPROVED" },
        take: 5,
      },
    },
  });
}

export async function deleteAccountAction() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Not authenticated");
  await prisma.user.delete({ where: { id: session.user.id } });
  await signOut({ redirectTo: "/" });
}
