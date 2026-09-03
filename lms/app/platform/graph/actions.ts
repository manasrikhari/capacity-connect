"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/app/generated/prisma/client";
import type { ActionState } from "@/lib/action-state";
import { invalidateGraphCache } from "@/lib/graphrag-db";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/session";
import { graphNodeSchema, graphRelationSchema } from "@/lib/validations/graph";

/** Any node/relation change must drop the GraphRAG cache so MeghDoot sees it. */
function afterWrite() {
  invalidateGraphCache();
  revalidatePath("/platform/graph");
}

export async function createNodeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSuperAdmin();
  const parsed = graphNodeSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    category: formData.get("category") ?? "",
    description: formData.get("description") ?? "",
    source: formData.get("source") ?? "",
    equation: formData.get("equation") ?? "",
    aliases: formData.get("aliases") ?? "",
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const { name, type, category, description, source, equation, aliases } = parsed.data;

  const metadata: Record<string, unknown> = {};
  if (aliases.length) metadata.aliases = aliases;
  if (source) metadata.source = source;
  if (equation) metadata.equation = equation;

  try {
    await prisma.knowledgeNode.create({
      data: {
        name,
        type,
        category: category || null,
        description: description || null,
        metadata: Object.keys(metadata).length
          ? (metadata as Prisma.InputJsonValue)
          : Prisma.DbNull,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: `A node named “${name}” already exists.` };
    }
    throw e;
  }

  afterWrite();
  return { success: true };
}

export async function deleteNodeAction(id: string) {
  await requireSuperAdmin();
  const node = await prisma.knowledgeNode.findUnique({ where: { id }, select: { id: true } });
  if (!node) return { error: "Node not found" };
  // Relations referencing this node cascade-delete via the schema.
  await prisma.knowledgeNode.delete({ where: { id } });
  afterWrite();
  return { success: true as const };
}

export async function createRelationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSuperAdmin();
  const parsed = graphRelationSchema.safeParse({
    sourceId: formData.get("sourceId"),
    targetId: formData.get("targetId"),
    relationType: formData.get("relationType"),
    weight: formData.get("weight"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const { sourceId, targetId, relationType, weight } = parsed.data;

  if (sourceId === targetId) {
    return { error: "Source and target must be different nodes." };
  }

  try {
    await prisma.knowledgeRelation.create({
      data: { sourceId, targetId, relationType, weight },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") return { error: "That relation already exists." };
      if (e.code === "P2003") return { error: "Source or target node not found." };
    }
    throw e;
  }

  afterWrite();
  return { success: true };
}

export async function deleteRelationAction(id: string) {
  await requireSuperAdmin();
  const rel = await prisma.knowledgeRelation.findUnique({ where: { id }, select: { id: true } });
  if (!rel) return { error: "Relation not found" };
  await prisma.knowledgeRelation.delete({ where: { id } });
  afterWrite();
  return { success: true as const };
}
