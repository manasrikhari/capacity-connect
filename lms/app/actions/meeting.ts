"use server";
import { SignJWT } from "jose";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { triggerMeetingStarted } from "@/lib/pusher-server";

export async function generateTemporaryToken(user: any, role: "student" | "teacher", meetingId: string, batchId: string) {
  const secret = new TextEncoder().encode(
    process.env.LIVE_OPENGRAPES_JWT_SECRET || "fallback-secret"
  );
  
  return await new SignJWT({
    userId: user.id,
    name: user.name || "Participant",
    email: user.email,
    role: role,
    meetingId: meetingId,
    batchId: batchId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret);
}

export async function joinMeetingAction(
  meetingId: string
): Promise<{ url: string; error?: undefined } | { url?: undefined; error: string }> {
  const session = await getSession();
  if (!session || !session.user || session.user.role !== "STUDENT") {
    return { error: "Unauthorized: Please log in as a student first." };
  }

  // 1. Fetch meeting & verify it exists
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: { batch: true },
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

  // 3. Generate token for student role
  const token = await generateTemporaryToken(session.user, "student", meeting.id, meeting.batchId);

  const meetingPlatformUrl = process.env.MEETING_PLATFORM_URL || "http://localhost:3002";

  // 4. Hand the URL back so the caller can open it (e.g. in a new tab)
  return { url: `${meetingPlatformUrl}/?token=${encodeURIComponent(token)}` };
}

export async function startClassAction(
  batchId: string
): Promise<{ url: string; error?: undefined } | { url?: undefined; error: string }> {
  const session = await getSession();
  if (!session || !session.user || session.user.role !== "ADMIN") {
    return { error: "Unauthorized: Please log in as an administrator/teacher first." };
  }

  // 1. Check if a class is already running for this batch
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
        link: process.env.MEETING_PLATFORM_URL || "http://localhost:3002",
        status: "LIVE",
      },
    });
    meetingId = meeting.id;

    const batch = await prisma.batch.findUnique({ where: { id: batchId }, select: { name: true } });
    await triggerMeetingStarted({
      meetingId: meeting.id,
      batchId,
      batchName: batch?.name ?? "",
      title: meeting.title,
    });
  }

  // 2. Generate token for teacher role
  const token = await generateTemporaryToken(session.user, "teacher", meetingId, batchId);

  const meetingPlatformUrl = process.env.MEETING_PLATFORM_URL || "http://localhost:3002";

  revalidatePath("/admin/meetings");
  revalidatePath("/student/meetings");
  revalidatePath("/admin/dashboard");

  // 3. Hand the URL back so the caller can open it (e.g. in a new tab)
  return { url: `${meetingPlatformUrl}/?token=${encodeURIComponent(token)}` };
}

