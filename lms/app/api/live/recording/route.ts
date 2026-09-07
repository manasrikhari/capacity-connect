import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  authenticateLiveService,
  ensureLiveSession,
  internalError,
  parseJsonBody,
} from "../_lib";

export const runtime = "nodejs";

const recordingSchema = z.object({
  /** Playable URL of the finished recording (egress output). */
  fileUrl: z.string().url(),
  title: z.string().optional(),
  durationSeconds: z.number().positive().optional(),
  mimeType: z.string().optional(),
  fileSizeBytes: z.number().positive().optional(),
});

/**
 * Recording sink (Phase 4). When LiveKit finishes a room-composite egress the
 * live backend posts the output URL here; we file it as a RECORDED_LECTURE in
 * the course library so trainees who missed the class can watch it back. The
 * uploader is the course owner. Idempotent per (batch, fileUrl).
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateLiveService(req);
  if (auth.response) return auth.response;
  const { roomId, batchId } = auth.claims;

  const body = await parseJsonBody(req, recordingSchema);
  if (body.response) return body.response;
  const { fileUrl, title, durationSeconds, mimeType, fileSizeBytes } = body.data;

  try {
    const session = await ensureLiveSession(roomId, batchId);
    const targetBatchId = session.batchId; // authoritative — set at session start

    const batch = await prisma.batch.findUnique({
      where: { id: targetBatchId },
      select: { teacherId: true },
    });
    if (!batch) {
      return NextResponse.json({ ok: false, reason: "no-batch" }, { status: 404 });
    }

    // Idempotent: a re-posted egress URL must not create a duplicate item.
    const existing = await prisma.libraryItem.findFirst({
      where: { batchId: targetBatchId, type: "RECORDED_LECTURE", fileUrl },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ ok: true, libraryItemId: existing.id, deduped: true });
    }

    const meeting = await prisma.meeting.findUnique({
      where: { id: roomId },
      select: { title: true },
    });
    const item = await prisma.libraryItem.create({
      data: {
        batchId: targetBatchId,
        uploaderId: batch.teacherId,
        title: title?.trim() || `${meeting?.title ?? "Live class"} — recording`,
        type: "RECORDED_LECTURE",
        fileUrl,
        mimeType: mimeType ?? null,
        fileSizeBytes: fileSizeBytes ?? null,
        durationMins: durationSeconds ? Math.max(1, Math.round(durationSeconds / 60)) : null,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, libraryItemId: item.id });
  } catch (err) {
    return internalError("recording", err);
  }
}
