import {
  ArrowRight,
  ClipboardList,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StudentStatusButton } from "@/components/admin/StudentStatusButton";
import { StartMeetingButton } from "@/components/admin/StartMeetingButton";
import { Badge } from "@/components/ui/Badge";
import { CopyJoinCode } from "@/components/ui/CopyJoinCode";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { getSession } from "@/lib/session";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import {
  formatDateTime,
  formatPaise,
  formatPaiseCompact,
  getEffectiveMeetingStatus,
} from "@/lib/utils";
import { LiveRefresh } from "@/components/realtime/LiveRefresh";
import { batchChannel, PUSHER_EVENTS } from "@/lib/pusher-channels";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/");
  const batch = await getActiveBatch(session);
  if (!batch) redirect("/admin");

  const [enrollments, meetings, notes, tests, fees, payments, liveSession] =
    await Promise.all([
      prisma.enrollment.findMany({
        where: { batchId: batch.id },
        include: {
          student: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.meeting.findMany({
        where: { batchId: batch.id },
        orderBy: { date: "asc" },
      }),
      prisma.note.findMany({
        where: { batchId: batch.id },
        orderBy: { updatedAt: "desc" },
        take: 3,
      }),
      prisma.test.findMany({
        where: { batchId: batch.id },
      }),
      prisma.fee.findMany({
        where: { batchId: batch.id },
      }),
      prisma.payment.findMany({
        where: { batchId: batch.id },
      }),
      prisma.liveSession.findFirst({
        where: { batchId: batch.id, status: "live" },
      }),
    ]);

  const approvedCount = enrollments.filter(
    (e) => e.status === "APPROVED"
  ).length;
  const pendingEnrollments = enrollments.filter(
    (e) => e.status === "PENDING"
  );

  const upcomingMeetings = meetings.filter(
    (m) => getEffectiveMeetingStatus(m) !== "ENDED"
  );
  const nextMeetings = upcomingMeetings.slice(0, 3);

  const totalNotes = await prisma.note.count({
    where: { batchId: batch.id },
  });

  const activeTests = tests.filter((t) => t.isActive).length;

  const totalFees = fees.reduce((sum, f) => sum + f.totalAmount, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const outstanding = Math.max(totalFees - totalPaid, 0);

  const meetingStatusColor = {
    UPCOMING: "blue" as const,
    LIVE: "red" as const,
    ENDED: "slate" as const,
  };

  const meetingStatusLabel = {
    UPCOMING: "Upcoming",
    LIVE: "Live",
    ENDED: "Ended",
  };

  return (
    <div className="space-y-6">
      <LiveRefresh
        channels={[batchChannel(batch.id)]}
        bindings={[
          { event: PUSHER_EVENTS.ENROLLMENT_REQUESTED, toastMessageKey: "enrollmentRequested" },
          { event: PUSHER_EVENTS.MEETING_STARTED, toastMessageKey: "meetingStarted" },
          { event: PUSHER_EVENTS.MEETING_ENDED, toastMessageKey: "meetingEnded" },
        ]}
      />
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="wrap-break-word text-2xl font-normal text-ink-900">{batch.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-500">
            {batch.grade && <span>{batch.grade}</span>}
            {batch.grade && <span className="text-ink-300">·</span>}
            <span className="inline-flex items-center gap-1.5">
              Join code
              <span className="font-mono text-plum-700">
                {batch.joinCode}
              </span>
              <CopyJoinCode code={batch.joinCode} />
            </span>
          </p>
        </div>
        <StartMeetingButton batchId={batch.id} isLive={!!liveSession} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <StatCard
          icon={Users}
          label="Approved students"
          value={approvedCount}
        />
        <StatCard
          icon={ClipboardList}
          label="Active tests"
          value={activeTests}
        />
      </div>

      {/* Preview sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pending requests */}
        <Card>
          <CardHeader>
            <CardTitle>
              Pending requests
              <Badge color={pendingEnrollments.length > 0 ? "amber" : "slate"} className="ml-2 align-middle">
                {pendingEnrollments.length}
              </Badge>
            </CardTitle>
            {pendingEnrollments.length > 0 && (
              <Link
                href="/admin/students"
                className="flex shrink-0 items-center gap-1 text-xs font-medium text-plum-700 hover:underline"
              >
                View all <ArrowRight className="size-3" />
              </Link>
            )}
          </CardHeader>
          {pendingEnrollments.length === 0 ? (
            <p className="text-sm text-ink-500">No pending requests.</p>
          ) : (
            <ul className="space-y-3">
              {pendingEnrollments.slice(0, 5).map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900">
                      {e.student.name ?? "Unnamed"}
                    </p>
                    <p className="truncate text-xs text-ink-500">
                      {e.student.email}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <StudentStatusButton
                      enrollmentId={e.id}
                      status="APPROVED"
                      variant="primary"
                    >
                      Approve
                    </StudentStatusButton>
                    <StudentStatusButton
                      enrollmentId={e.id}
                      status="REJECTED"
                      variant="danger"
                    >
                      Reject
                    </StudentStatusButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Upcoming meetings */}
        <Card>
          <CardHeader>
            <CardTitle>
              Upcoming meetings
              <Badge color="blue" className="ml-2 align-middle">{upcomingMeetings.length}</Badge>
            </CardTitle>
            <Link
              href="/admin/meetings"
              className="flex shrink-0 items-center gap-1 text-xs font-medium text-plum-700 hover:underline"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          {nextMeetings.length === 0 ? (
            <p className="text-sm text-ink-500">No upcoming meetings.</p>
          ) : (
            <ul className="space-y-3">
              {nextMeetings.map((m) => {
                const status = getEffectiveMeetingStatus(m);
                return (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-900">
                        {m.title}
                      </p>
                      <p className="truncate font-mono text-xs text-ink-500">
                        {formatDateTime(m.date)} · {m.durationMins} min
                      </p>
                    </div>
                    <Badge color={meetingStatusColor[status]}>
                      {meetingStatusLabel[status]}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Recent notes */}
        <Card>
          <CardHeader>
            <CardTitle>
              Recent notes
              <Badge color="violet" className="ml-2 align-middle">{totalNotes}</Badge>
            </CardTitle>
            <Link
              href="/admin/notes"
              className="flex shrink-0 items-center gap-1 text-xs font-medium text-plum-700 hover:underline"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          {notes.length === 0 ? (
            <p className="text-sm text-ink-500">No notes yet.</p>
          ) : (
            <ul className="space-y-3">
              {notes.map((n) => (
                <li key={n.id} className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">
                    {n.title}
                  </p>
                  <p className="truncate text-xs text-ink-500">{n.subject}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Fees summary */}
        <Card>
          <CardHeader>
            <CardTitle>
              Fees
              <Badge
                color={outstanding > 0 ? "amber" : "green"}
                className="ml-2 align-middle"
              >
                {outstanding > 0 ? `${formatPaiseCompact(outstanding)} due` : "Fully paid"}
              </Badge>
            </CardTitle>
            <Link
              href="/admin/fees"
              className="flex shrink-0 items-center gap-1 text-xs font-medium text-plum-700 hover:underline"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-500">Total due</span>
              <span className="font-mono tabular-nums text-ink-900">
                {formatPaise(totalFees)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-500">Collected</span>
              <span className="font-mono tabular-nums text-sage-700">
                {formatPaise(totalPaid)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-500">Outstanding</span>
              <span
                className={`font-mono tabular-nums ${outstanding > 0 ? "text-status-unpaid" : "text-ink-900"}`}
              >
                {formatPaise(outstanding)}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
