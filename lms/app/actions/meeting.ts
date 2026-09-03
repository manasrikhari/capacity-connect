"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { generateLiveToken } from "@/lib/live-token";
import { getEffectiveMeetingStatus } from "@/lib/utils";
import { triggerMeetingStarted } from "@/lib/pusher-server";

type UrlOrError =
  | { url: string; error?: undefined }
  | { url?: undefined; error: string };

const DEFAULT_DURATION_MINS = 60;

export async function joinMeetingAction(meetingId: string): Promise<UrlOrError> {
  const session = await getSession();
  if (!session || !session.user || session.user.role !== "STUDENT") {
    return { error: "Unauthorized: Please log in as a student first." };
  }

  // 1. Fetch meeting & verify it exists
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
  });

  if (!meeting) {
    return { error: "Meeting session not found." };
  }

  // 2. Validate enrollment
  const enrolled = await prisma.enrollment.findUnique({
    where: {
      studentId_batchId: {
        studentId: session.user.id,
        batchId: meeting.batchId,
      },
    },
  });

  if (!enrolled || enrolled.status !== "APPROVED") {
    return { error: "You are not enrolled in this batch." };
  }

  // 3. Only allow joining while the class is actually live: either a live
  // session row exists for this room, or the meeting itself is (effectively)
  // LIVE — the 3-hour auto-end rule applies.
  const liveSession = await prisma.liveSession.findUnique({
    where: { roomId: meeting.id },
    select: { status: true },
  });
  const meetingIsLive = getEffectiveMeetingStatus(meeting) === "LIVE";
  if (liveSession?.status !== "live" && !meetingIsLive) {
    return { error: "This class is not live right now." };
  }

  // 4. Generate token for student role
  const token = await generateLiveToken(session.user, "student", meeting.id, meeting.batchId);

  const meetingPlatformUrl = process.env.MEETING_PLATFORM_URL || "http://localhost:3002";

  // 5. Hand the URL back so the caller can open it (e.g. in a new tab)
  return { url: `${meetingPlatformUrl}/?token=${encodeURIComponent(token)}` };
}

export async function startClassAction(batchId: string): Promise<UrlOrError> {
  const session = await getSession();
  if (!session || !session.user || session.user.role !== "ADMIN") {
    return { error: "Unauthorized: Please log in as an administrator/teacher first." };
  }

  // 1. Verify the caller owns this batch
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    select: { id: true, name: true, teacherId: true },
  });
  if (!batch || batch.teacherId !== session.user.id) {
    return { error: "You do not own this batch." };
  }

  // 2. Check if a class is already running for this batch
  const existingLiveSession = await prisma.liveSession.findFirst({
    where: { batchId, status: "live" },
  });

  let meetingId: string;

  if (existingLiveSession) {
    meetingId = existingLiveSession.roomId;
  } else {
    // Create a new meeting record automatically
    const formattedDate = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const meeting = await prisma.meeting.create({
      data: {
        batchId,
        title: `Class - ${formattedDate}`,
        description: `Live class started on ${formattedDate}`,
        date: new Date(),
        durationMins: DEFAULT_DURATION_MINS,
        link: process.env.MEETING_PLATFORM_URL || "http://localhost:3002",
        status: "LIVE",
      },
    });
    meetingId = meeting.id;

    await triggerMeetingStarted({
      meetingId: meeting.id,
      batchId,
      batchName: batch.name,
      title: meeting.title,
    });
  }

  // 3. Generate token for teacher role
  const token = await generateLiveToken(session.user, "teacher", meetingId, batchId);

  const meetingPlatformUrl = process.env.MEETING_PLATFORM_URL || "http://localhost:3002";

  revalidatePath("/admin/meetings");
  revalidatePath("/student/meetings");
  revalidatePath("/admin/dashboard");

  // 4. Hand the URL back so the caller can open it (e.g. in a new tab)
  return { url: `${meetingPlatformUrl}/?token=${encodeURIComponent(token)}` };
}
