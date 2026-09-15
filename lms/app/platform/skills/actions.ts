"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/session";
import { skillSchema } from "@/lib/validations/skill";

function parse(formData: FormData) {
  return skillSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    description: formData.get("description"),
  });
}

export async function createSkillAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSuperAdmin();
  const parsed = parse(formData);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const existing = await prisma.skill.findUnique({ where: { name: parsed.data.name } });
  if (existing) return { error: "A skill with that name already exists." };
  await prisma.skill.create({
    data: {
      name: parsed.data.name,
      category: parsed.data.category,
      description: parsed.data.description || null,
    },
  });
  revalidatePath("/platform/skills");
  return { success: true };
}

export async function updateSkillAction(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSuperAdmin();
  const parsed = parse(formData);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  await prisma.skill.update({
    where: { id },
    data: {
      name: parsed.data.name,
      category: parsed.data.category,
      description: parsed.data.description || null,
    },
  });
  revalidatePath("/platform/skills");
  return { success: true };
}

export async function deleteSkillAction(id: string): Promise<{ error?: string }> {
  await requireSuperAdmin();
  await prisma.skill.delete({ where: { id } });
  revalidatePath("/platform/skills");
  return {};
}
