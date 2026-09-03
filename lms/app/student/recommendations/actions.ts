"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/** Request to join a recommended course — creates a PENDING enrollment. */
export async function requestEnrollmentAction(batchId: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") return { error: "Not authorised" };

  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch || batch.status !== "ACTIVE") return { error: "Course not available" };

  await prisma.enrollment.upsert({
    where: { studentId_batchId: { studentId: session.user.id, batchId } },
    update: {}, // don't clobber an existing (e.g. approved) enrollment
    create: { studentId: session.user.id, batchId, status: "PENDING" },
  });

  revalidatePath("/student/recommendations");
  return {};
}
