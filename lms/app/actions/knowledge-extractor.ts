"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@/app/generated/prisma/client";
import type { ActionState } from "@/lib/action-state";
import { invalidateGraphCache } from "@/lib/graphrag-db";
import { normaliseName } from "@/lib/knowledge-extract";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { saveProposalSchema } from "@/lib/validations/knowledge-extract";

export type SaveKnowledgeState =
  | (ActionState & {
      summary?: { created: number; merged: number; reused: number; relations: number; skipped: number };
    })
  | null;

type NodeMetadata = { aliases?: string[]; source?: string; equation?: string };

/**
 * Write a reviewed proposal into the knowledge graph.
 *
 * Merge semantics, given that `KnowledgeNode.name` is globally unique and
 * Postgres string uniqueness is case-sensitive (so every comparison is
 * normalised first):
 *
 *  - No match          → create, scoped to the trainer's course or national.
 *  - Match, same scope → fill only empty fields and union aliases. A curated
 *                        description is never overwritten.
 *  - Match, other scope→ no write at all; the node is reused as a relation
 *                        endpoint only. A trainer must not be able to mutate a
 *                        national concept that every other course reads.
 *
 * A relation whose endpoint cannot be resolved is skipped and counted, never
 * silently turned into a new node.
 */
export async function saveKnowledgeProposalAction(
  _prev: SaveKnowledgeState,
  formData: FormData,
): Promise<SaveKnowledgeState> {
  const session = await requireStaff();
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  let payload: unknown;
  try {
    payload = JSON.parse(formData.get("proposal")?.toString() ?? "");
  } catch {
    return { error: "The edited proposal could not be read." };
  }

  const parsed = saveProposalSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: `Check the highlighted rows: ${first?.message ?? "invalid proposal"}.` };
  }
  const { nodes, relations, sourceLabel } = parsed.data;

  // Resolve scope server-side; never trust the client's claim.
  let targetBatchId: string | null = null;
  if (!isSuperAdmin) {
    const batch = await prisma.batch.findFirst({
      where: { teacherId: session.user.id, status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (!batch) return { error: "You have no active course." };
    targetBatchId = batch.id;
  }

  let created = 0;
  let merged = 0;
  let reused = 0;
  let skipped = 0;
  let relationCount = 0;

  await prisma.$transaction(async (tx) => {
    const existingRows = await tx.knowledgeNode.findMany({
      select: { id: true, name: true, batchId: true, description: true, category: true, metadata: true },
    });
    const byName = new Map(existingRows.map((r) => [normaliseName(r.name), r]));
    /** Normalised name → node id, for relation resolution. */
    const idByName = new Map(existingRows.map((r) => [normaliseName(r.name), r.id]));

    for (const n of nodes) {
      const key = normaliseName(n.name);
      const existing = byName.get(key);

      if (!existing) {
        const metadata: NodeMetadata = { source: sourceLabel };
        if (n.aliases.length > 0) metadata.aliases = n.aliases;
        if (n.equation) metadata.equation = n.equation;
        const row = await tx.knowledgeNode.create({
          data: {
            name: n.name,
            type: n.type,
            category: n.category || null,
            description: n.description,
            batchId: targetBatchId,
            metadata: metadata as Prisma.InputJsonValue,
          },
          select: { id: true },
        });
        idByName.set(key, row.id);
        created++;
        continue;
      }

      idByName.set(key, existing.id);

      // Out of scope: reuse as an endpoint, but never mutate.
      if (existing.batchId !== targetBatchId) {
        reused++;
        continue;
      }

      const prevMeta = (existing.metadata as NodeMetadata | null) ?? {};
      const aliases = [...new Set([...(prevMeta.aliases ?? []), ...n.aliases])].slice(0, 5);
      const nextMeta: NodeMetadata = {
        ...prevMeta,
        source: prevMeta.source || sourceLabel,
        equation: prevMeta.equation || n.equation || undefined,
      };
      if (aliases.length > 0) nextMeta.aliases = aliases;

      await tx.knowledgeNode.update({
        where: { id: existing.id },
        data: {
          // Fill-only: a human-written description is never clobbered.
          description: existing.description?.trim() ? existing.description : n.description,
          category: existing.category?.trim() ? existing.category : n.category || null,
          metadata: nextMeta as Prisma.InputJsonValue,
        },
      });
      merged++;
    }

    const relationData = relations.flatMap((r) => {
      const sourceId = idByName.get(normaliseName(r.sourceName));
      const targetId = idByName.get(normaliseName(r.targetName));
      if (!sourceId || !targetId || sourceId === targetId) {
        skipped++;
        return [];
      }
      return [{ sourceId, targetId, relationType: r.relationType, weight: r.weight }];
    });

    if (relationData.length > 0) {
      const res = await tx.knowledgeRelation.createMany({
        data: relationData,
        skipDuplicates: true,
      });
      relationCount = res.count;
    }
  });

  // The GraphRAG cache is per-process and 60s; drop it now so MeghDoot cites
  // the new concepts immediately, exactly as the manual graph editor does.
  invalidateGraphCache();
  revalidatePath("/platform/graph");
  revalidatePath("/admin/knowledge");

  return {
    success: true,
    summary: { created, merged, reused, relations: relationCount, skipped },
  };
}
