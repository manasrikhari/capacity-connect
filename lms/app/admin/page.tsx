import { redirect } from "next/navigation";
import { BatchHub } from "@/components/admin/BatchHub";
import { getSession } from "@/lib/session";
import { getTeacherHubData } from "@/lib/batch";
import { LiveRefresh } from "@/components/realtime/LiveRefresh";
import { batchChannel, PUSHER_EVENTS } from "@/lib/pusher-channels";

export default async function AdminHubPage() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const { batches, stats } = await getTeacherHubData(session);

  return (
    <>
      <LiveRefresh
        channels={batches.map((b) => batchChannel(b.id))}
        bindings={[
          { event: PUSHER_EVENTS.ENROLLMENT_REQUESTED, toastMessageKey: "enrollmentRequested" },
          { event: PUSHER_EVENTS.MEETING_STARTED, toastMessageKey: "meetingStarted" },
          { event: PUSHER_EVENTS.MEETING_ENDED, toastMessageKey: "meetingEnded" },
        ]}
      />
      <BatchHub batches={batches} stats={stats} />
    </>
  );
}
