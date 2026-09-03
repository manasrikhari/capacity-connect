"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { meetingSchema } from "@/lib/validations/meeting";
import { triggerMeetingEnded } from "@/lib/pusher-server";
import { generateLiveToken } from "@/lib/live-token";
import { getEffectiveMeetingStatus } from "@/lib/utils";

function parseMeetingForm(formData: FormData) {
  return meetingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    date: formData.get("date"),
    durationMins: formData.get("durationMins"),
    link: formData.get("link"),
  });
}

export async function createMeeting(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active batch" };

  const parsed = parseMeetingForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const date = new Date(parsed.data.date);
  if (Number.isNaN(date.getTime())) {
    return { fieldErrors: { date: ["Enter a valid date and time"] } };
  }

  await prisma.meeting.create({
    data: {
      batchId: batch.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      date,
      durationMins: parsed.data.durationMins,
      link: parsed.data.link ?? "",
      status: "UPCOMING",
    },
  });

  revalidatePath("/admin/meetings");
  revalidatePath("/student/meetings");
  return { success: true };
}

export async function updateMeeting(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active batch" };

  const parsed = parseMeetingForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const date = new Date(parsed.data.date);
  if (Number.isNaN(date.getTime())) {
    return { fieldErrors: { date: ["Enter a valid date and time"] } };
  }

  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting || meeting.batchId !== batch.id) {
    return { error: "Meeting not found" };
  }

  await prisma.meeting.update({
    where: { id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      date,
      durationMins: parsed.data.durationMins,
      link: parsed.data.link ?? "",
    },
  });

  revalidatePath("/admin/meetings");
  revalidatePath("/student/meetings");
  return { success: true };
}

export async function setMeetingStatus(id: string, status: "LIVE" | "ENDED" | "UPCOMING") {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active batch" };

  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting || meeting.batchId !== batch.id) {
    return { error: "Meeting not found" };
  }

  await prisma.meeting.update({ where: { id }, data: { status } });

  if (status === "ENDED") {
    await prisma.liveSession.updateMany({
      where: { roomId: id, status: "live" },
      data: { status: "completed", endedAt: new Date() },
    });

    await triggerMeetingEnded({
      meetingId: id,
      batchId: batch.id,
      batchName: batch.name,
    });

    // Notify the Live Meetings backend to clean up and delete the room in LiveKit
    const meetingPlatformApiUrl = process.env.MEETING_PLATFORM_API_URL;
    if (meetingPlatformApiUrl) {
      try {
        const token = await generateLiveToken(session.user, "teacher", id, batch.id);
        const res = await fetch(`${meetingPlatformApiUrl}/api/end-class`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ batchId: batch.id, hasNotes: true }),
        });
        if (!res.ok) {
          console.error(`[LMS End Class Sync] Backend returned error: ${res.status} ${await res.text()}`);
        } else {
          console.log(`[LMS End Class Sync] Successfully synchronized end class with backend for room: ${id}`);
        }
      } catch (err) {
        console.error("[LMS End Class Sync] Failed to call video backend end-class API:", err);
      }
    }
  }

  revalidatePath("/admin/meetings");
  revalidatePath("/student/meetings");
  return { success: true as const };
}

export async function deleteMeeting(id: string) {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active batch" };

  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting || meeting.batchId !== batch.id) {
    return { error: "Meeting not found" };
  }

  await prisma.meeting.delete({ where: { id } });

  revalidatePath("/admin/meetings");
  revalidatePath("/student/meetings");
  return { success: true as const };
}

type AttendanceRecord = { studentId: string; status: "PRESENT" | "ABSENT" };

/**
 * Save the attendance roster for a class that has already happened.
 * Upserts one Attendance row per (approved) student, keyed on the
 * [meetingId, studentId] unique. Only allowed once the class has ended.
 */
export async function saveAttendance(
  meetingId: string,
  records: AttendanceRecord[]
): Promise<ActionState> {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) return { error: "No active batch" };

  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting || meeting.batchId !== batch.id) {
    return { error: "Meeting not found" };
  }

  // Guard: attendance is only for classes that have actually happened.
  if (getEffectiveMeetingStatus(meeting) !== "ENDED") {
    return { error: "You can only mark attendance for classes that have ended" };
  }

  // Only mark students who are approved in this batch.
  const enrollments = await prisma.enrollment.findMany({
    where: { batchId: meeting.batchId, status: "APPROVED" },
    select: { studentId: true },
  });
  const approvedIds = new Set(enrollments.map((e) => e.studentId));

  const clean = records.filter(
    (r) =>
      approvedIds.has(r.studentId) &&
      (r.status === "PRESENT" || r.status === "ABSENT")
  );

  if (clean.length === 0) {
    return { error: "No students to mark" };
  }

  await prisma.$transaction(
    clean.map((r) =>
      prisma.attendance.upsert({
        where: { meetingId_studentId: { meetingId, studentId: r.studentId } },
        create: {
          meetingId,
          studentId: r.studentId,
          batchId: meeting.batchId,
          status: r.status,
        },
        update: { status: r.status },
      })
    )
  );

  revalidatePath("/admin/meetings");
  revalidatePath("/student/meetings");
  revalidatePath("/student/dashboard");
  return { success: true };
}
