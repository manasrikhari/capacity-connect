"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

const weekSchema = z.object({
  title: z.string().min(2, "Give the week a title").max(160),
  summary: z.string().max(600).optional().or(z.literal("")),
  opensAt: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : null))
    .refine((d) => d === null || !Number.isNaN(d.getTime()), "Enter a valid date"),
});

/** The kinds of content that can be filed into a week. */
const ASSIGNABLE = ["LIBRARY", "NOTE", "TEST", "ASSIGNMENT"] as const;
type Assignable = (typeof ASSIGNABLE)[number];

async function ownedBatch() {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return null;
  // getActiveBatch already scopes to this trainer's own courses.
  return batch;
}

export async function createWeekAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const batch = await ownedBatch();
  if (!batch) return { error: "No active course." };

  const parsed = weekSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    opensAt: formData.get("opensAt"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  // Append to the end. Index is 1-based and unique per course, so read the
  // current maximum rather than counting rows — a deleted week must not cause
  // a collision.
  const last = await prisma.courseWeek.findFirst({
    where: { batchId: batch.id },
    orderBy: { index: "desc" },
    select: { index: true },
  });

  await prisma.courseWeek.create({
    data: {
      batchId: batch.id,
      index: (last?.index ?? 0) + 1,
      title: parsed.data.title,
      summary: parsed.data.summary || null,
      opensAt: parsed.data.opensAt,
    },
  });

  revalidatePath("/admin/weeks");
  revalidatePath("/student/course");
  return { success: true };
}

export async function deleteWeekAction(weekId: string): Promise<{ error?: string }> {
  const batch = await ownedBatch();
  if (!batch) return { error: "No active course." };

  const week = await prisma.courseWeek.findFirst({
    where: { id: weekId, batchId: batch.id },
    select: { id: true },
  });
  if (!week) return { error: "That week is not part of this course." };

  // Content keeps existing and falls back to "Unsorted" — the relations are
  // onDelete: SetNull, so deleting a week never destroys a trainer's material.
  await prisma.courseWeek.delete({ where: { id: weekId } });

  revalidatePath("/admin/weeks");
  revalidatePath("/student/course");
  return {};
}

/**
 * File a piece of content into a week (or out of one, with `weekId: null`).
 *
 * Every branch re-checks that the item belongs to the trainer's own course, so
 * a posted id cannot move somebody else's content.
 */
export async function assignToWeekAction(
  kind: string,
  itemId: string,
  weekId: string | null,
): Promise<{ error?: string }> {
  const batch = await ownedBatch();
  if (!batch) return { error: "No active course." };

  if (!(ASSIGNABLE as readonly string[]).includes(kind)) {
    return { error: "Unknown content type." };
  }

  if (weekId) {
    const week = await prisma.courseWeek.findFirst({
      where: { id: weekId, batchId: batch.id },
      select: { id: true },
    });
    if (!week) return { error: "That week is not part of this course." };
  }

  const where = { id: itemId, batchId: batch.id };
  const data = { weekId };

  switch (kind as Assignable) {
    case "LIBRARY":
      await prisma.libraryItem.updateMany({ where, data });
      break;
    case "NOTE":
      await prisma.note.updateMany({ where, data });
      break;
    case "TEST":
      await prisma.test.updateMany({ where, data });
      break;
    case "ASSIGNMENT":
      await prisma.assignment.updateMany({ where, data });
      break;
  }

  revalidatePath("/admin/weeks");
  revalidatePath("/student/course");
  return {};
}
