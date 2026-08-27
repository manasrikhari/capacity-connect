import { redirect } from "next/navigation";
import { MeetingsManager } from "@/components/admin/MeetingsManager";
import { getSession } from "@/lib/session";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { LiveRefresh } from "@/components/realtime/LiveRefresh";
import { batchChannel, PUSHER_EVENTS } from "@/lib/pusher-channels";

export default async function AdminMeetingsPage() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/");
  const batch = await getActiveBatch(session);
  if (!batch) redirect("/admin");

  const meetings = await prisma.meeting.findMany({
    where: { batchId: batch.id },
    orderBy: { date: "desc" },
  });

  const liveSession = await prisma.liveSession.findFirst({
    where: { batchId: batch.id, status: "live" },
  });

  const liveSessions = await prisma.liveSession.findMany({
    where: {
      roomId: { in: meetings.map((m) => m.id) }
    },
    include: {
      meetingMinutes: true
    }
  });

  return (
    <>
      <LiveRefresh
        channels={[batchChannel(batch.id)]}
        bindings={[{ event: PUSHER_EVENTS.MEETING_STARTED }, { event: PUSHER_EVENTS.MEETING_ENDED }]}
      />
      <MeetingsManager
        meetings={meetings}
        liveSession={liveSession}
        liveSessions={liveSessions}
        batchId={batch.id}
      />
    </>
  );
}
