"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { weatherCaseSchema } from "@/lib/validations/weather-case";

export async function createWeatherCase(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active batch" };

  const parsed = weatherCaseSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    hazard: formData.get("hazard"),
    region: formData.get("region"),
    imageUrl: formData.get("imageUrl"),
    correctColour: formData.get("correctColour"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  await prisma.weatherCase.create({
    data: {
      batchId: batch.id,
      createdById: session.user.id,
      title: d.title,
      description: d.description,
      hazard: d.hazard || null,
      region: d.region || null,
      imageUrl: d.imageUrl || null,
      correctColour: d.correctColour,
    },
  });

  revalidatePath("/admin/drill");
  revalidatePath("/student/drill");
  return { success: true };
}

export async function deleteWeatherCase(id: string) {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active batch" };

  const weatherCase = await prisma.weatherCase.findUnique({ where: { id } });
  if (!weatherCase || weatherCase.batchId !== batch.id) return { error: "Case not found" };

  await prisma.weatherCase.delete({ where: { id } });

  revalidatePath("/admin/drill");
  revalidatePath("/student/drill");
  return { success: true as const };
}
