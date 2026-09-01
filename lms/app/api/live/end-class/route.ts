import { type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { triggerMeetingEnded } from "@/lib/pusher-server";
import { authenticateLiveService, internalError, jsonOk, parseJsonBody } from "../_lib";

export const runtime = "nodejs";

const endClassSchema = z.object({
  hasNotes: z.boolean().optional(),
});

/**
 * Called by the live classroom backend when the class ends.
 * Idempotent: an already-completed session keeps its original endedAt.
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateLiveService(req);
  if (auth.response) return auth.response;
  const { roomId, batchId } = auth.claims;

  const body = await parseJsonBody(req, endClassSchema);
  if (body.response) return body.response;
  const { hasNotes } = body.data;

  try {
    const existing = await prisma.liveSession.findUnique({ where: { roomId } });
    if (existing) {
      await prisma.liveSession.update({
        where: { roomId },
        data: {
          status: "completed",
          endedAt: existing.endedAt ?? new Date(),
          hasNotes: hasNotes ?? existing.hasNotes,
        },
      });
    } else {
      await prisma.liveSession.create({
        data: {
          roomId,
          batchId,
          status: "completed",
          endedAt: new Date(),
          hasNotes: hasNotes ?? false,
        },
      });
    }

    // End the matching Meeting, if this room belongs to one.
    await prisma.meeting.updateMany({
      where: { id: roomId, NOT: { status: "ENDED" } },
      data: { status: "ENDED" },
    });

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      select: { name: true },
    });
    await triggerMeetingEnded({
      meetingId: roomId,
      batchId,
      batchName: batch?.name ?? "",
    });

    return jsonOk();
  } catch (err) {
    return internalError("end-class", err);
  }
}
