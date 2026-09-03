"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/app/generated/prisma/client";
import type { ActionState } from "@/lib/action-state";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { deleteStoredFile } from "@/lib/storage";
import { libraryItemSchema } from "@/lib/validations/library";

function parseLibraryForm(formData: FormData) {
  return libraryItemSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    type: formData.get("type"),
    subject: formData.get("subject"),
    skillId: formData.get("skillId"),
    fileUrl: formData.get("fileUrl"),
    externalUrl: formData.get("externalUrl"),
    mimeType: formData.get("mimeType"),
    fileSizeBytes: formData.get("fileSizeBytes") || undefined,
    durationMins: formData.get("durationMins") || undefined,
  });
}

/**
 * Resolve the effective file reference: prefer an uploaded file (fileUrl set by
 * the client after POSTing to /api/upload), otherwise fall back to an external
 * URL (YouTube / Drive / manual link). Returns null when neither is present.
 */
function resolveSource(data: {
  fileUrl?: string;
  externalUrl?: string;
  mimeType?: string;
  fileSizeBytes?: number;
}): { fileUrl: string; mimeType: string | null; fileSizeBytes: number | null } | null {
  const uploaded = data.fileUrl?.trim();
  if (uploaded) {
    return {
      fileUrl: uploaded,
      mimeType: data.mimeType?.trim() || null,
      fileSizeBytes: typeof data.fileSizeBytes === "number" ? data.fileSizeBytes : null,
    };
  }
  const external = data.externalUrl?.trim();
  if (external) {
    return { fileUrl: external, mimeType: null, fileSizeBytes: null };
  }
  return null;
}

/** Extract [batchId, storedName] from a local /api/files/ URL, else null. */
function parseLocalFileUrl(fileUrl: string): { batchId: string; storedName: string } | null {
  const match = /^\/api\/files\/([^/]+)\/([^/]+)$/.exec(fileUrl);
  if (!match) return null;
  return { batchId: match[1], storedName: match[2] };
}

export async function createLibraryItemAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active course" };

  const parsed = parseLibraryForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const source = resolveSource(parsed.data);
  if (!source) {
    return { fieldErrors: { fileUrl: ["Upload a file or provide an external URL"] } };
  }

  await prisma.libraryItem.create({
    data: {
      batchId: batch.id,
      uploaderId: session.user.id,
      title: parsed.data.title,
      description: parsed.data.description?.trim() || null,
      type: parsed.data.type,
      subject: parsed.data.subject?.trim() || null,
      skillId: parsed.data.skillId?.trim() || null,
      fileUrl: source.fileUrl,
      mimeType: source.mimeType,
      fileSizeBytes: source.fileSizeBytes,
      durationMins:
        typeof parsed.data.durationMins === "number" ? parsed.data.durationMins : null,
    },
  });

  revalidatePath("/admin/library");
  revalidatePath("/student/library");
  return { success: true };
}

export async function updateLibraryItemAction(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active course" };

  const existing = await prisma.libraryItem.findUnique({ where: { id } });
  if (!existing || existing.batchId !== batch.id) {
    return { error: "Item not found" };
  }

  const parsed = parseLibraryForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const source = resolveSource(parsed.data);
  // Build the data patch. Metadata always updates; the file reference only
  // changes when a new source was supplied (so editing text keeps the file).
  const data: Prisma.LibraryItemUpdateInput = {
    title: parsed.data.title,
    description: parsed.data.description?.trim() || null,
    type: parsed.data.type,
    subject: parsed.data.subject?.trim() || null,
    skill: parsed.data.skillId?.trim()
      ? { connect: { id: parsed.data.skillId.trim() } }
      : { disconnect: true },
    durationMins:
      typeof parsed.data.durationMins === "number" ? parsed.data.durationMins : null,
  };

  if (source) {
    // Replacing the source: clean up the previous local file if it changed.
    if (source.fileUrl !== existing.fileUrl) {
      const prev = parseLocalFileUrl(existing.fileUrl);
      if (prev) await deleteStoredFile(prev.batchId, prev.storedName);
    }
    data.fileUrl = source.fileUrl;
    data.mimeType = source.mimeType;
    data.fileSizeBytes = source.fileSizeBytes;
  }

  await prisma.libraryItem.update({ where: { id }, data });

  revalidatePath("/admin/library");
  revalidatePath("/student/library");
  return { success: true };
}

export async function deleteLibraryItemAction(id: string) {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active course" };

  const item = await prisma.libraryItem.findUnique({ where: { id } });
  if (!item || item.batchId !== batch.id) {
    return { error: "Item not found" };
  }

  await prisma.libraryItem.delete({ where: { id } });

  // Remove the backing file for locally stored uploads.
  const local = parseLocalFileUrl(item.fileUrl);
  if (local) await deleteStoredFile(local.batchId, local.storedName);

  revalidatePath("/admin/library");
  revalidatePath("/student/library");
  return { success: true as const };
}
