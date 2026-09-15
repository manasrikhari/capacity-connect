"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { setBatchRequirements } from "@/lib/competency-db";
import { trainerSkillSchema } from "@/lib/validations/skill";

const requirementsPayload = z.array(
  z.object({
    skillId: z.string().min(1),
    minProficiency: z.coerce.number().int().min(1).max(5),
    weight: z.coerce.number().min(0.1).max(5),
    isMandatory: z.coerce.boolean(),
  }),
);

export async function saveRequirementsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active course" };

  let raw: unknown;
  try {
    raw = JSON.parse((formData.get("requirements") as string) || "[]");
  } catch {
    return { error: "Could not read the requirements." };
  }
  const parsed = requirementsPayload.safeParse(raw);
  if (!parsed.success) return { error: "Some requirement rows are invalid." };

  // Guard against duplicate skills.
  const seen = new Set<string>();
  const reqs = parsed.data.filter((r) => {
    if (seen.has(r.skillId)) return false;
    seen.add(r.skillId);
    return true;
  });

  await setBatchRequirements(batch.id, reqs);
  revalidatePath("/admin/competency");
  revalidatePath("/platform/competency");
  return { success: true };
}

export async function upsertTrainerSkillAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireAdmin();
  const parsed = trainerSkillSchema.safeParse({
    skillId: formData.get("skillId"),
    proficiency: formData.get("proficiency"),
    yearsExperience: formData.get("yearsExperience"),
    isVerified: false, // trainers can't self-verify; only the MoES admin verifies
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { skillId, proficiency, yearsExperience } = parsed.data;
  await prisma.trainerSkill.upsert({
    where: { trainerId_skillId: { trainerId: session.user.id, skillId } },
    update: { proficiency, yearsExperience }, // preserves isVerified
    create: { trainerId: session.user.id, skillId, proficiency, yearsExperience },
  });
  revalidatePath("/admin/competency");
  revalidatePath("/platform/competency");
  return { success: true };
}

export async function deleteTrainerSkillAction(id: string): Promise<{ error?: string }> {
  const session = await requireAdmin();
  const row = await prisma.trainerSkill.findUnique({ where: { id } });
  if (!row || row.trainerId !== session.user.id) return { error: "Not found" };
  await prisma.trainerSkill.delete({ where: { id } });
  revalidatePath("/admin/competency");
  return {};
}
