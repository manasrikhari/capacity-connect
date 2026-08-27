"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { noteSchema } from "@/lib/validations/note";

function parseNoteForm(formData: FormData) {
  return noteSchema.safeParse({
    title: formData.get("title"),
    subject: formData.get("subject"),
    content: formData.get("content"),
    fileUrl: formData.get("fileUrl"),
  });
}

export async function createNote(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active batch" };

  const parsed = parseNoteForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await prisma.note.create({
    data: {
      batchId: batch.id,
      title: parsed.data.title,
      subject: parsed.data.subject,
      content: parsed.data.content,
      fileUrl: parsed.data.fileUrl || null,
    },
  });

  revalidatePath("/admin/notes");
  revalidatePath("/student/notes");
  return { success: true };
}

export async function updateNote(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active batch" };

  const parsed = parseNoteForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || note.batchId !== batch.id) {
    return { error: "Note not found" };
  }

  await prisma.note.update({
    where: { id },
    data: {
      title: parsed.data.title,
      subject: parsed.data.subject,
      content: parsed.data.content,
      fileUrl: parsed.data.fileUrl || null,
    },
  });

  revalidatePath("/admin/notes");
  revalidatePath("/student/notes");
  return { success: true };
}

export async function deleteNote(id: string) {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active batch" };

  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || note.batchId !== batch.id) {
    return { error: "Note not found" };
  }

  await prisma.note.delete({ where: { id } });

  revalidatePath("/admin/notes");
  revalidatePath("/student/notes");
  return { success: true as const };
}
