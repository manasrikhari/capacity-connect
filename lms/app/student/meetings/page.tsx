import { Video } from "lucide-react";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { getSession } from "@/lib/session";
import { getActiveStudentBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { formatDateTime, getEffectiveMeetingStatus } from "@/lib/utils";
import { MeetingsList } from "@/components/student/MeetingsList";
import { JoinMeetingButton } from "@/components/student/JoinMeetingButton";
import { LiveRefresh } from "@/components/realtime/LiveRefresh";
import { batchChannel, PUSHER_EVENTS } from "@/lib/pusher-channels";

export default async function StudentMeetingsPage() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");
  const batch = await getActiveStudentBatch(session);
  if (!batch) redirect("/student");

  // Get active live session
  const liveSession = await prisma.liveSession.findFirst({
    where: { batchId: batch.id, status: "live" },
  });
  const isTeacherJoined = liveSession?.teacherJoined ?? false;

  // Find the active class meeting
  const activeMeeting = liveSession
    ? await prisma.meeting.findUnique({ where: { id: liveSession.roomId } })
    : null;

  // Get all meetings for this batch
  const meetings = await prisma.meeting.findMany({
    where: { batchId: batch.id },
    orderBy: { date: "desc" },
  });

  // Get matching live sessions to check for MoM (meetingMinutes) and hasNotes
  const liveSessions = await prisma.liveSession.findMany({
    where: {
      roomId: { in: meetings.map((m) => m.id) },
    },
    include: {
      meetingMinutes: true,
    },
  });

  // This student's own attendance across the batch's classes.
  const attendance = await prisma.attendance.findMany({
    where: { studentId: session.user.id, batchId: batch.id },
    select: { meetingId: true, status: true },
  });

  const sessionMap = new Map(liveSessions.map((s) => [s.roomId, s]));

  // Filter past meetings using getEffectiveMeetingStatus and session status
  const pastMeetings = meetings.filter((m) => {
    if (m.id === liveSession?.roomId) return false;

    const sess = sessionMap.get(m.id);
    if (sess && sess.status !== "live") return true;

    return getEffectiveMeetingStatus(m) === "ENDED";
  });

  return (
    <div className="space-y-8">
      <LiveRefresh
        channels={[batchChannel(batch.id)]}
        bindings={[
          { event: PUSHER_EVENTS.MEETING_STARTED, toastMessageKey: "meetingStarted" },
          { event: PUSHER_EVENTS.MEETING_ENDED, toastMessageKey: "meetingEnded" },
          { event: PUSHER_EVENTS.TEACHER_JOINED, toastMessageKey: "teacherJoined" },
        ]}
      />
      <div>
        <h1 className="text-2xl text-ink-900">Meetings</h1>
        <p className="mt-1 text-sm text-ink-500">
          Join the live class and revisit past ones.
        </p>
      </div>

      {/* Active class — the one raised, dark surface, only when live. */}
      <section className="space-y-3">
        <h2 className="border-b border-hair-strong pb-2 text-sm font-semibold text-ink-900">
          Active session
        </h2>
        {liveSession && activeMeeting ? (
          <div
            className="relative overflow-hidden rounded-3xl border border-board-edge bg-board p-6 text-chalk"
            style={{ boxShadow: "var(--shadow-lg)" }}
          >
            <div
              className="pointer-events-none absolute inset-0 text-chalk/5 bg-dot-grid"
              aria-hidden
            />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-muted">
                  <span
                    className="inline-block size-2 rounded-full bg-status-live"
                    style={{ animation: "live-pulse 1.8s var(--ease-out) infinite" }}
                  />
                  Live now
                </div>
                <h3 className="text-2xl text-chalk">{activeMeeting.title}</h3>
                {activeMeeting.description && (
                  <p className="text-sm text-chalk-muted">{activeMeeting.description}</p>
                )}
                <p className="font-mono text-xs text-chalk-muted">
                  Started {formatDateTime(liveSession.startedAt)} · {activeMeeting.durationMins} min
                </p>
              </div>
              <div className="shrink-0">
                {isTeacherJoined ? (
                  <JoinMeetingButton
                    meetingId={activeMeeting.id}
                    className="bg-chalk text-board hover:bg-chalk/90"
                  >
                    Join now
                  </JoinMeetingButton>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-[10px] border border-chalk/30 px-3 py-1.5 text-sm font-medium text-chalk-muted">
                    <span className="inline-block size-2 animate-pulse rounded-full bg-chalk-muted" />
                    Waiting for teacher…
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Video}
            title="No class on the board"
            description="Your teacher hasn't started the class yet. It'll appear here the moment they do."
          />
        )}
      </section>

      {/* Past History */}
      <section className="space-y-3">
        <h2 className="border-b border-hair-strong pb-2 text-sm font-semibold text-ink-900">
          Past classes
        </h2>
        {pastMeetings.length === 0 ? (
          <EmptyState
            icon={Video}
            title="No past classes"
            description="Classes you've attended will show up here."
          />
        ) : (
          <MeetingsList meetings={pastMeetings} liveSessions={liveSessions} attendance={attendance} />
        )}
      </section>
    </div>
  );
}
