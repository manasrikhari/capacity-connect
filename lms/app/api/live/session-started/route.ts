import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerMeetingStarted, triggerTeacherJoined } from "@/lib/pusher-server";
import { authenticateLiveService, internalError, jsonOk } from "../_lib";

export const runtime = "nodejs";

/**
 * Called by the live classroom backend when the teacher starts/joins a room.
 * Idempotent: re-calls simply re-assert the live state.
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateLiveService(req);
  if (auth.response) return auth.response;
  const { roomId, batchId } = auth.claims;

  try {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      select: { id: true, name: true },
    });
    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    await prisma.liveSession.upsert({
      where: { roomId },
      update: { status: "live", teacherJoined: true },
      create: { roomId, batchId, status: "live", teacherJoined: true },
    });

    // The LMS creates Meetings whose id doubles as the live roomId; a room
    // started outside a scheduled meeting simply has no Meeting row.
    const meeting = await prisma.meeting.findUnique({
      where: { id: roomId },
      select: { id: true, title: true, status: true },
    });
    const wasAlreadyLive = meeting?.status === "LIVE";
    if (meeting && !wasAlreadyLive) {
      await prisma.meeting.update({
        where: { id: meeting.id },
        data: { status: "LIVE" },
      });
    }

    await triggerTeacherJoined({ roomId, batchId, batchName: batch.name });
    if (meeting && !wasAlreadyLive) {
      await triggerMeetingStarted({
        meetingId: meeting.id,
        batchId,
        batchName: batch.name,
        title: meeting.title,
      });
    }

    return jsonOk();
  } catch (err) {
    return internalError("session-started", err);
  }
}
