import { type NextRequest, NextResponse } from "next/server";
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

// Base64 screenshot payloads are stored in the DB — cap them at ~2MB of text.
const SCREENSHOT_MAX_CHARS = 2 * 1024 * 1024;

const doubtSchema = z.object({
  lmsUserId: z.string().min(1),
  doubtText: z.string().min(1).max(4000),
  answer: z.string().max(20000).default(""),
  screenshot: z.string().max(SCREENSHOT_MAX_CHARS).nullable().optional(),
});

/** Called by the live classroom backend when a doubt is asked/answered in class. */
export async function POST(req: NextRequest) {
  const auth = await authenticateLiveService(req);
  if (auth.response) return auth.response;
  const { roomId, batchId } = auth.claims;

  const body = await parseJsonBody(req, doubtSchema);
  if (body.response) return body.response;
  const { lmsUserId, doubtText, answer, screenshot } = body.data;

  try {
    const student = await prisma.user.findUnique({
      where: { id: lmsUserId },
      select: { id: true },
    });
    if (!student) {
      return NextResponse.json({ error: "Unknown lmsUserId" }, { status: 404 });
    }

    await ensureLiveSession(roomId, batchId);

    await prisma.doubt.create({
      data: {
        sessionId: roomId,
        studentId: lmsUserId,
        doubtText,
        answer,
        screenshot: screenshot ?? null,
      },
    });

    return jsonOk();
  } catch (err) {
    return internalError("doubt", err);
  }
}
