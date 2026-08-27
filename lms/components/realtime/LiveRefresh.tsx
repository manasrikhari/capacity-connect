"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { usePusherChannels } from "@/lib/pusher-client";
import type {
  EnrollmentRequestedPayload,
  EnrollmentUpdatedPayload,
  MeetingStartedPayload,
  MeetingEndedPayload,
  TeacherJoinedPayload,
} from "@/lib/pusher-server";

export type ToastMessageKey =
  | "enrollmentRequested"
  | "enrollmentUpdated"
  | "meetingStarted"
  | "meetingEnded"
  | "teacherJoined";

// Server Components can't pass functions as props to Client Components (only
// data and Server Actions serialize across that boundary), so callers pass a
// string key instead and the actual message-building logic lives here.
function buildToastMessage(key: ToastMessageKey | undefined, data: unknown): string | null {
  switch (key) {
    case "enrollmentRequested": {
      const d = data as EnrollmentRequestedPayload;
      return `${d.studentName ?? d.studentEmail} requested to join ${d.batchName}`;
    }
    case "enrollmentUpdated": {
      const d = data as EnrollmentUpdatedPayload;
      return d.status === "APPROVED"
        ? `You're approved for ${d.batchName}!`
        : `Your request for ${d.batchName} was declined.`;
    }
    case "meetingStarted": {
      const d = data as MeetingStartedPayload;
      return `Class started for ${d.batchName}`;
    }
    case "meetingEnded": {
      const d = data as MeetingEndedPayload;
      return `Class ended for ${d.batchName}`;
    }
    case "teacherJoined": {
      const d = data as TeacherJoinedPayload;
      return `Your teacher joined ${d.batchName} — you can join now!`;
    }
    default:
      return null;
  }
}

/**
 * Subscribes to `channels` for each event in `bindings`; when one fires,
 * re-fetches this page's Server Component data from the DB (`router.refresh()`)
 * so the UI always reflects the real, current DB state rather than a
 * client-merged guess from the event payload. Renders nothing.
 */
export function LiveRefresh({
  channels,
  bindings,
}: {
  channels: string[];
  bindings: { event: string; toastMessageKey?: ToastMessageKey }[];
}) {
  const router = useRouter();

  const eventHandlers = Object.fromEntries(
    bindings.map(({ event, toastMessageKey }) => [
      event,
      (data: unknown) => {
        const message = buildToastMessage(toastMessageKey, data);
        if (message) toast(message, { position: "top-center" });
        router.refresh();
      },
    ])
  );

  usePusherChannels(channels, eventHandlers);
  return null;
}
