"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { traineeSkillSchema } from "@/lib/validations/skill";

export async function upsertTraineeSkillAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") return { error: "Not authorised" };

  const parsed = traineeSkillSchema.safeParse({
    skillId: formData.get("skillId"),
    proficiency: formData.get("proficiency"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { skillId, proficiency } = parsed.data;
  const traineeId = session.user.id;

  const existing = await prisma.traineeSkill.findUnique({
    where: { traineeId_skillId: { traineeId, skillId } },
  });

  const isEarned =
    existing?.source?.startsWith("TEST:") || existing?.source?.startsWith("CERTIFICATE:");

  if (existing && isEarned && proficiency < existing.proficiency) {
    return {
      error: "You can't lower a level earned from an assessment or certificate.",
    };
  }

  if (!existing) {
    await prisma.traineeSkill.create({
      data: { traineeId, skillId, proficiency, source: "SELF_DECLARED" },
    });
  } else {
    await prisma.traineeSkill.update({
      where: { id: existing.id },
      // Keep the stronger (earned) source label; only self-declared rows relabel.
      data: { proficiency, source: isEarned ? existing.source : "SELF_DECLARED" },
    });
  }

  revalidatePath("/student/competency");
  return { success: true };
}
