"use server";

import { revalidatePath } from "next/cache";
import type { ApprovalStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/session";

export async function updateTeacherStatus(input: {
  teacherId: string;
  status: Extract<ApprovalStatus, "APPROVED" | "REJECTED" | "SUSPENDED">;
}) {
  await requireSuperAdmin();

  const teacher = await prisma.user.findUnique({
    where: { id: input.teacherId },
  });

  if (!teacher || teacher.role !== "ADMIN") {
    return { error: "Teacher not found" };
  }

  await prisma.user.update({
    where: { id: input.teacherId },
    data: { status: input.status },
  });

  revalidatePath("/platform");
  return { success: true as const };
}
