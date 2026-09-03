"use server";

import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { setActiveBatchForTeacher } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { batchSchema } from "@/lib/validations/batch";

export async function setActiveBatchAction(batchId: string) {
  const session = await requireAdmin();
  await setActiveBatchForTeacher(session, batchId);
  redirect("/admin/dashboard");
}

export async function createBatchAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();

  const parsed = batchSchema.safeParse({
    name: formData.get("name"),
    subject: formData.get("subject"),
    grade: formData.get("grade"),
    description: formData.get("description"),
    department: formData.get("department"),
    wmoTier: formData.get("wmoTier"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const d = parsed.data;

  const joinCode = await generateUniqueJoinCode();

  const batch = await prisma.batch.create({
    data: {
      name: d.name,
      subject: d.subject,
      grade: d.grade || null,
      description: d.description || null,
      department: d.department || null,
      wmoTier: d.wmoTier || null,
      startDate: d.startDate,
      endDate: d.endDate,
      teacherId: session.user.id,
      joinCode,
    },
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

/**
 * Join codes are @unique. Math.random can collide, so retry a few times,
 * checking the batch table for an existing code before settling on one.
 */
async function generateUniqueJoinCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateJoinCode();
    const existing = await prisma.batch.findUnique({ where: { joinCode: code } });
    if (!existing) return code;
  }
  return generateJoinCode();
}
