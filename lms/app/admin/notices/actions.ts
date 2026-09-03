"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { noticeSchema } from "@/lib/validations/notice";

export async function createNotice(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active batch" };

  const parsed = noticeSchema.safeParse({ text: formData.get("text") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await prisma.notice.create({
    data: {
      batchId: batch.id,
      teacherId: session.user.id,
      text: parsed.data.text,
    },
  });

  revalidatePath("/admin/notices");
  revalidatePath("/student/dashboard");
  return { success: true };
}

export async function deleteNotice(id: string) {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active batch" };

  const notice = await prisma.notice.findUnique({ where: { id } });
  if (!notice || notice.batchId !== batch.id) return { error: "Notice not found" };

  await prisma.notice.delete({ where: { id } });

  revalidatePath("/admin/notices");
  revalidatePath("/student/dashboard");
  return { success: true as const };
}
