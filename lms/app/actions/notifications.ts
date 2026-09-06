"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/** Mark one notification read (only the owner's own). */
export async function markNotificationRead(id: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Not signed in" };
  await prisma.notification.updateMany({
    where: { id, userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/");
  return {};
}

/** Mark every unread notification read for the signed-in user. */
export async function markAllNotificationsRead(): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Not signed in" };
  await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/");
  return {};
}
