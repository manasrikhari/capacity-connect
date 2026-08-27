export function batchChannel(batchId: string): string {
  return `private-batch-${batchId}`;
}

export function userChannel(userId: string): string {
  return `private-user-${userId}`;
}

/** Extracts the batchId from a channel name produced by batchChannel(), or null if it isn't one. */
export function parseBatchChannel(channelName: string): string | null {
  const match = channelName.match(/^private-batch-(.+)$/);
  return match ? match[1] : null;
}

/** Extracts the userId from a channel name produced by userChannel(), or null if it isn't one. */
export function parseUserChannel(channelName: string): string | null {
  const match = channelName.match(/^private-user-(.+)$/);
  return match ? match[1] : null;
}

export const PUSHER_EVENTS = {
  ENROLLMENT_REQUESTED: "enrollment-requested",
  ENROLLMENT_UPDATED: "enrollment-updated",
  MEETING_STARTED: "meeting-started",
  MEETING_ENDED: "meeting-ended",
  TEACHER_JOINED: "teacher-joined",
} as const;
