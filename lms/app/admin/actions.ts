"use server";

import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { setActiveBatchForTeacher } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function setActiveBatchAction(batchId: string) {
  const session = await requireAdmin();
  await setActiveBatchForTeacher(session, batchId);
  redirect("/admin/dashboard");
}

export async function createBatchAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();

  const name = (formData.get("name") as string | null)?.trim();
  const subject = (formData.get("subject") as string | null)?.trim() || null;

  if (!name) {
    return { error: "Batch name is required." };
  }

  const joinCode = generateJoinCode();

  const batch = await prisma.batch.create({
    data: { name, subject, teacherId: session.user.id, joinCode },
  });

  await setActiveBatchForTeacher(session, batch.id);
  redirect("/admin/dashboard");
}

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${part()}-${part()}`;
}
