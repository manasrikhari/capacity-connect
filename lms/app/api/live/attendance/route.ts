import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { buildAttendanceRoster } from "@/lib/attendance";
import {
  authenticateLiveService,
  ensureLiveSession,
  internalError,
  parseJsonBody,
} from "../_lib";

export const runtime = "nodejs";

const attendanceSchema = z.object({
  /** Actual class length in seconds; falls back to the meeting's scheduled duration. */
  durationSeconds: z.number().positive().optional(),
  /** Present ≥ this fraction of the class → PRESENT (defaults to 0.5 in the roster builder). */
  threshold: z.number().min(0).max(1).optional(),
  participants: z
    .array(z.object({ userId: z.string().min(1), presenceSeconds: z.number().min(0) }))
    .default([]),
});

/**
 * Auto-attendance sink (Phase 4). The live backend, driven by LiveKit
 * participant_joined/left webhooks, posts each trainee's total presence when a
 * class ends. We turn that into one Attendance row per approved trainee —
 * PRESENT for those who stayed long enough, ABSENT for everyone else.
 *
 * A room started outside a scheduled Meeting has no Meeting row to hang
 * attendance off; that is reported back (recorded: 0) rather than treated as an
 * error, mirroring session-started's handling of ad-hoc rooms.
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateLiveService(req);
  if (auth.response) return auth.response;
  const { roomId, batchId } = auth.claims;

  const body = await parseJsonBody(req, attendanceSchema);
  if (body.response) return body.response;
  const { durationSeconds, threshold, participants } = body.data;

  try {
    await ensureLiveSession(roomId, batchId);

    // Attendance is per Meeting; the LMS creates Meetings whose id doubles as
    // the roomId (see session-started). No Meeting → nothing to record.
    const meeting = await prisma.meeting.findUnique({
      where: { id: roomId },
      select: { id: true, batchId: true, durationMins: true },
    });
    if (!meeting) {
      return NextResponse.json({ ok: true, recorded: 0, reason: "no-meeting" });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { batchId: meeting.batchId, status: "APPROVED" },
      select: { studentId: true },
    });
    const approvedIds = enrollments.map((e) => e.studentId);
    if (approvedIds.length === 0) {
      return NextResponse.json({ ok: true, recorded: 0, reason: "no-approved-trainees" });
    }

    const classDuration = durationSeconds ?? meeting.durationMins * 60;
    const roster = buildAttendanceRoster(approvedIds, participants, classDuration, threshold);

    await prisma.$transaction(
      roster.map((r) =>
        prisma.attendance.upsert({
          where: { meetingId_studentId: { meetingId: meeting.id, studentId: r.userId } },
          create: {
            meetingId: meeting.id,
            studentId: r.userId,
            batchId: meeting.batchId,
            status: r.status,
          },
          update: { status: r.status },
        }),
      ),
    );

    return NextResponse.json({ ok: true, recorded: roster.length });
  } catch (err) {
    return internalError("attendance", err);
  }
}
