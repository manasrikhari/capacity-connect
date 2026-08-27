import {
  ArrowRight,
  ClipboardList,
  NotebookText,
  Video,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { getSession } from "@/lib/session";
import { getActiveStudentBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { JoinMeetingButton } from "@/components/student/JoinMeetingButton";
import {
  formatDateTime,
  formatPaise,
  getFeeStatus,
  getEffectiveMeetingStatus,
} from "@/lib/utils";
import { LiveRefresh } from "@/components/realtime/LiveRefresh";
import { batchChannel, PUSHER_EVENTS } from "@/lib/pusher-channels";

const FEE_STATUS_LABELS: Record<string, string> = {
  PAID: "Paid",
  PARTIAL: "Partially paid",
  UNPAID: "Unpaid",
};

const FEE_STATUS_COLORS: Record<string, BadgeColor> = {
  PAID: "green",
  PARTIAL: "amber",
  UNPAID: "red",
};

const MEETING_STATUS_COLORS: Record<string, BadgeColor> = {
  UPCOMING: "blue",
  LIVE: "green",
  ENDED: "slate",
};

export default async function StudentDashboardPage() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");
  const batch = await getActiveStudentBatch(session);
  if (!batch) redirect("/student");

  const studentId = session.user.id;

  const [meetings, notes, tests, fee, payments, liveSession] = await Promise.all([
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
      where: { batchId: batch.id, isActive: true },
      include: {
        _count: { select: { questions: true } },
        attempts: { where: { studentId } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.fee.findUnique({
      where: { studentId_batchId: { studentId, batchId: batch.id } },
    }),
    prisma.payment.findMany({
      where: { studentId, batchId: batch.id },
    }),
    prisma.liveSession.findFirst({
      where: { batchId: batch.id, status: "live" },
    }),
  ]);

  const upcomingMeetings = meetings.filter(
    (m) => getEffectiveMeetingStatus(m) !== "ENDED"
  );
  const nextMeetings = upcomingMeetings.slice(0, 3);

  const totalNotes = await prisma.note.count({
    where: { batchId: batch.id },
  });

  const attempted = tests.filter((t) => t.attempts.length > 0).length;
  const unattempted = tests.filter((t) => t.attempts.length === 0);

  const totalAmount = fee?.totalAmount ?? 0;
  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const outstanding = Math.max(totalAmount - paidAmount, 0);
  const feeStatus = getFeeStatus(totalAmount, paidAmount);
  const isTeacherJoined = liveSession?.teacherJoined ?? false;

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
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="wrap-break-word text-2xl font-bold text-slate-800">{batch.name}</h1>
          {batch.grade && (
          <p className="mt-1 text-sm text-slate-500">{batch.grade}</p>
        )}
        </div>
        {liveSession ? (
          isTeacherJoined ? (
            <JoinMeetingButton meetingId={liveSession.roomId} />
          ) : (
            <button
              type="button"
              disabled
              aria-label="Waiting for teacher to join class"
              className="flex shrink-0 items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 text-sm font-medium text-amber-700 shadow-sm transition-all duration-200 ease-out cursor-not-allowed animate-pulse"
            >
              <Video className="size-4 animate-bounce" />
              <span>Waiting for teacher...</span>
            </button>
          )
        ) : (
          <button
            type="button"
            disabled
            aria-label="No active meeting at this time"
            className="flex shrink-0 items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-400 border border-slate-200 shadow-inner cursor-not-allowed"
          >
            <Video className="size-4" />
            <span>No active class</span>
          </button>
        )}
        
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Video}
          label="Upcoming"
          value={upcomingMeetings.length}
          color="blue"
        />
        <StatCard
          icon={ClipboardList}
          label="Tests"
          value={tests.length}
          hint={`${attempted} attempted`}
          color="violet"
        />
        <StatCard
          icon={NotebookText}
          label="Notes"
          value={totalNotes}
          color="violet"
        />
        <StatCard
          icon={Wallet}
          label="Fees"
          value={
            totalAmount === 0
              ? "N/A"
              : FEE_STATUS_LABELS[feeStatus]
          }
          hint={outstanding > 0 ? `${formatPaise(outstanding)} outstanding` : undefined}
          color={FEE_STATUS_COLORS[feeStatus] ?? "slate"}
        />
      </div>

      {/* Preview sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming meetings */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming meetings</CardTitle>
            <Link
              href="/student/meetings"
              className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:underline"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          {nextMeetings.length === 0 ? (
            <p className="text-sm text-slate-400">No upcoming meetings.</p>
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
                      <p className="truncate text-sm font-medium text-slate-800">
                        {m.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDateTime(m.date)}
                      </p>
                    </div>
                    {status === "LIVE" ? (
                      <a
                        href={m.link}
                        target="_blank"
                        rel="noreferrer"
                        className={buttonClasses("primary", "sm")}
                      >
                        Join now
                      </a>
                    ) : (
                      <Badge color={MEETING_STATUS_COLORS[status]}>
                        {status === "UPCOMING" ? "Upcoming" : "Ended"}
                      </Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Active tests */}
        <Card>
          <CardHeader>
            <CardTitle>Active tests</CardTitle>
            <Link
              href="/student/tests"
              className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:underline"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          {tests.length === 0 ? (
            <p className="text-sm text-slate-400">No active tests.</p>
          ) : unattempted.length === 0 ? (
            <p className="text-sm text-slate-400">
              All {tests.length} test{tests.length !== 1 && "s"} attempted.
            </p>
          ) : (
            <ul className="space-y-3">
              {unattempted.slice(0, 3).map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {t.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t._count.questions} questions · {t.subject}
                    </p>
                  </div>
                  <Link
                    href={`/student/tests/${t.id}`}
                    className={buttonClasses("primary", "sm")}
                  >
                    Start
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent notes */}
        <Card>
          <CardHeader>
            <CardTitle>Recent notes</CardTitle>
            <Link
              href="/student/notes"
              className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:underline"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          {notes.length === 0 ? (
            <p className="text-sm text-slate-400">No notes yet.</p>
          ) : (
            <ul className="space-y-3">
              {notes.map((n) => (
                <li key={n.id}>
                  <Link
                    href={`/student/notes/${n.id}`}
                    className="group block"
                  >
                    <p className="text-sm font-medium text-slate-800 group-hover:text-violet-600">
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500">{n.subject}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Fee summary */}
        <Card>
          <CardHeader>
            <CardTitle>Fees</CardTitle>
            <Link
              href="/student/fees"
              className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:underline"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          {totalAmount === 0 ? (
            <p className="text-sm text-slate-400">No fee assigned yet.</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Total fee</span>
                <span className="font-medium text-slate-800">
                  {formatPaise(totalAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Paid</span>
                <span className="font-medium text-emerald-600">
                  {formatPaise(paidAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Outstanding</span>
                <span className="font-medium text-amber-600">
                  {formatPaise(outstanding)}
                </span>
              </div>
              <div className="pt-1">
                <Badge color={FEE_STATUS_COLORS[feeStatus]}>
                  {FEE_STATUS_LABELS[feeStatus]}
                </Badge>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
