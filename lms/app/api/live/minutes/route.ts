import { type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  authenticateLiveService,
  ensureLiveSession,
  internalError,
  jsonOk,
  parseJsonBody,
} from "../_lib";

export const runtime = "nodejs";

const minutesSchema = z.object({
  content: z.string().min(1),
});

/**
 * Called by the live classroom backend with the generated minutes of a class.
 * Idempotent: re-posting replaces the minutes for the room.
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateLiveService(req);
  if (auth.response) return auth.response;
  const { roomId, batchId } = auth.claims;

  const body = await parseJsonBody(req, minutesSchema);
  if (body.response) return body.response;
  const { content } = body.data;

  try {
    await ensureLiveSession(roomId, batchId);

    await prisma.meetingMinutes.upsert({
      where: { sessionId: roomId },
      update: { content },
      create: { sessionId: roomId, content },
    });

    return jsonOk();
  } catch (err) {
    return internalError("minutes", err);
  }
}
