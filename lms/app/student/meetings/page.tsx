import { Video } from "lucide-react";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
      roomId: { in: meetings.map((m) => m.id) }
    },
    include: {
      meetingMinutes: true
    }
  });

  const sessionMap = new Map(liveSessions.map((s) => [s.roomId, s]));

  // Filter past meetings using getEffectiveMeetingStatus and session status
  const pastMeetings = meetings.filter((m) => {
    if (m.id === liveSession?.roomId) return false;

    const session = sessionMap.get(m.id);
    if (session && session.status !== "live") return true;

    return getEffectiveMeetingStatus(m) === "ENDED";
  });

  return (
    <div className="space-y-6">
      <LiveRefresh
        channels={[batchChannel(batch.id)]}
        bindings={[
          { event: PUSHER_EVENTS.MEETING_STARTED, toastMessageKey: "meetingStarted" },
          { event: PUSHER_EVENTS.MEETING_ENDED, toastMessageKey: "meetingEnded" },
          { event: PUSHER_EVENTS.TEACHER_JOINED, toastMessageKey: "teacherJoined" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Meetings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Join active live classes and check history.
        </p>
      </div>

      {/* Active Class Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-700">Active Session</h2>
        {liveSession && activeMeeting ? (
          <Card className="border-emerald-200 bg-emerald-50/30">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge color="green" className="animate-pulse">
                    ● LIVE NOW
                  </Badge>
                  <h3 className="font-semibold text-slate-800">
                    {activeMeeting.title}
                  </h3>
                </div>
                {activeMeeting.description && (
                  <p className="mt-1 text-sm text-slate-500">
                    {activeMeeting.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  Started at {formatDateTime(liveSession.startedAt)}
                </p>
              </div>
              <div className="shrink-0">
                {isTeacherJoined ? (
                  <JoinMeetingButton
                    meetingId={activeMeeting.id}
                    className={buttonClasses("primary", "sm")}
                  >
                    Join now
                  </JoinMeetingButton>
                ) : (
                  <span className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800 animate-pulse">
                    Waiting for teacher...
                  </span>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <Card className="border-dashed border-slate-200 bg-slate-50/30 py-8 text-center text-sm text-slate-500">
            No active class. Your teacher has not started the class yet.
          </Card>
        )}
      </div>

      {/* Past History */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-700">Past Classes</h2>
        {pastMeetings.length === 0 ? (
          <EmptyState
            icon={Video}
            title="No past classes"
            description="Your past ended classes will show up here."
          />
        ) : (
          <MeetingsList meetings={pastMeetings} liveSessions={liveSessions} />
        )}
      </div>
    </div>
  );
}
