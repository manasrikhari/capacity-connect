import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateMinutes } from "@/lib/minutes";
import {
  authenticateLiveService,
  ensureLiveSession,
  internalError,
  parseJsonBody,
} from "../_lib";

export const runtime = "nodejs";

const transcriptSchema = z.object({
  transcript: z.string().min(1),
  /** Optionally skip minutes generation (e.g. the trainer already wrote them). */
  generateMinutes: z.boolean().optional(),
  /** Title for the knowledge source; falls back to the meeting/class name. */
  title: z.string().optional(),
});

/**
 * Live-class transcript sink (Phase 4). The live backend posts the accumulated
 * transcript when a class ends. We (1) persist it on the LiveSession, (2) turn
 * it into meeting minutes unless told not to, and (3) register a LIVE_CLASS
 * KnowledgeSource so the class becomes a citable origin the trainer can later
 * mine into the course knowledge graph. All best-effort and idempotent.
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateLiveService(req);
  if (auth.response) return auth.response;
  const { roomId, batchId } = auth.claims;

  const body = await parseJsonBody(req, transcriptSchema);
  if (body.response) return body.response;
  const { transcript, generateMinutes: wantMinutes, title } = body.data;

  try {
    await ensureLiveSession(roomId, batchId);
    await prisma.liveSession.update({ where: { roomId }, data: { transcript } });

    let minutesWritten = false;
    if (wantMinutes !== false) {
      const content = await generateMinutes(transcript);
      await prisma.meetingMinutes.upsert({
        where: { sessionId: roomId },
        update: { content },
        create: { sessionId: roomId, content },
      });
      await prisma.liveSession.update({ where: { roomId }, data: { hasNotes: true } });
      minutesWritten = true;
    }

    // Register the class as a knowledge source (idempotent per room via title).
    const meeting = await prisma.meeting.findUnique({
      where: { id: roomId },
      select: { title: true },
    });
    const sourceTitle = title?.trim() || meeting?.title || `Live class ${roomId.slice(-6)}`;
    const existingSource = await prisma.knowledgeSource.findFirst({
      where: { kind: "LIVE_CLASS", batchId, title: sourceTitle },
      select: { id: true },
    });
    if (!existingSource) {
      await prisma.knowledgeSource.create({
        data: { title: sourceTitle, kind: "LIVE_CLASS", batchId },
      });
    }

    return NextResponse.json({ ok: true, minutesWritten });
  } catch (err) {
    return internalError("transcript", err);
  }
}
