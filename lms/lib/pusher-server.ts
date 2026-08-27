import Pusher from "pusher";
import { batchChannel, userChannel, PUSHER_EVENTS } from "@/lib/pusher-channels";

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

// Best-effort — the DB write this always runs after has already succeeded,
// so a missing/misconfigured Pusher setup must never surface as a failure
// of the action that called it (e.g. a join/approve/start/end that actually
// worked must never show the user an error toast).
async function safeTrigger(channel: string, event: string, payload: unknown) {
  try {
    await pusherServer.trigger(channel, event, payload);
  } catch (err) {
    console.error(`[Pusher] Failed to trigger ${event} on ${channel}:`, err);
  }
}

export type EnrollmentRequestedPayload = {
  enrollmentId: string;
  studentId: string;
  studentName: string | null;
  studentEmail: string;
  batchId: string;
  batchName: string;
};

export async function triggerEnrollmentRequested(payload: EnrollmentRequestedPayload) {
  await safeTrigger(batchChannel(payload.batchId), PUSHER_EVENTS.ENROLLMENT_REQUESTED, payload);
}

export type EnrollmentUpdatedPayload = {
  enrollmentId: string;
  studentId: string;
  batchId: string;
  batchName: string;
  status: "APPROVED" | "REJECTED";
};

export async function triggerEnrollmentUpdated(payload: EnrollmentUpdatedPayload) {
  await safeTrigger(userChannel(payload.studentId), PUSHER_EVENTS.ENROLLMENT_UPDATED, payload);
}

export type MeetingStartedPayload = {
  meetingId: string;
  batchId: string;
  batchName: string;
  title: string;
};

export async function triggerMeetingStarted(payload: MeetingStartedPayload) {
  await safeTrigger(batchChannel(payload.batchId), PUSHER_EVENTS.MEETING_STARTED, payload);
}

export type MeetingEndedPayload = {
  meetingId: string;
  batchId: string;
  batchName: string;
};

export async function triggerMeetingEnded(payload: MeetingEndedPayload) {
  await safeTrigger(batchChannel(payload.batchId), PUSHER_EVENTS.MEETING_ENDED, payload);
}

// Fired by the separate opengrapes-live backend (its own repo), not from here —
// kept alongside the other payload types purely so the client-side toast
// builder in LiveRefresh has one shared source of truth for the shape.
export type TeacherJoinedPayload = {
  roomId: string;
  batchId: string;
  batchName: string;
};
