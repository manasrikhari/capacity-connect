import Pusher from "pusher";
import { batchChannel, userChannel, PUSHER_EVENTS } from "@/lib/pusher-channels";

// Pusher's constructor throws on missing config, so never construct the client
// unless every PUSHER_* env var is present and non-empty — an import of this
// module must never crash the server.
function readPusherConfig() {
  const appId = process.env.PUSHER_APP_ID?.trim();
  const key = process.env.PUSHER_KEY?.trim();
  const secret = process.env.PUSHER_SECRET?.trim();
  const cluster = process.env.PUSHER_CLUSTER?.trim();
  if (!appId || !key || !secret || !cluster) return null;
  return { appId, key, secret, cluster, useTLS: true };
}

function createPusherClient(): Pusher | null {
  const config = readPusherConfig();
  if (!config) return null;
  try {
    return new Pusher(config);
  } catch (err) {
    console.warn("[Pusher] Failed to construct client — realtime events are disabled:", err);
    return null;
  }
}

const client = createPusherClient();

let warnedDisabled = false;
function warnDisabled() {
  if (warnedDisabled) return;
  warnedDisabled = true;
  console.warn(
    "[Pusher] PUSHER_* env vars are missing or empty — realtime events are disabled (triggers no-op)."
  );
}

// Call-time-failing stand-in so existing `pusherServer` consumers (e.g. the
// channel-auth route) type-check and fail inside their own try/catch instead
// of at import time.
const disabledPusher = {
  async trigger() {
    warnDisabled();
  },
  authorizeChannel() {
    warnDisabled();
    throw new Error("Pusher is not configured (missing PUSHER_* env vars).");
  },
} as unknown as Pusher;

export const pusherServer: Pusher = client ?? disabledPusher;

// Best-effort — the DB write this always runs after has already succeeded,
// so a missing/misconfigured Pusher setup must never surface as a failure
// of the action that called it (e.g. a join/approve/start/end that actually
// worked must never show the user an error toast).
async function safeTrigger(channel: string, event: string, payload: unknown) {
  if (!client) {
    warnDisabled();
    return;
  }
  try {
    await client.trigger(channel, event, payload);
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

export type TeacherJoinedPayload = {
  roomId: string;
  batchId: string;
  batchName: string;
};

export async function triggerTeacherJoined(payload: TeacherJoinedPayload) {
  await safeTrigger(batchChannel(payload.batchId), PUSHER_EVENTS.TEACHER_JOINED, payload);
}
