import { MessageSquareHeart } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  StudentDashboard,
  type DashboardData,
} from "@/components/student/dashboard/StudentDashboard";
import { LiveRefresh } from "@/components/realtime/LiveRefresh";
import { Card } from "@/components/ui/Card";
import { getSession } from "@/lib/session";
import { getActiveStudentBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { batchChannel, PUSHER_EVENTS } from "@/lib/pusher-channels";
import { formatDate } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function sameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function timeLabel(d: Date): string {
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** "Today · 16:00", "Thursday · 16:00", or "12 Sep · 16:00". */
function whenLabel(d: Date, now: Date): string {
  const days = Math.round((startOfDay(d).getTime() - startOfDay(now).getTime()) / DAY_MS);
  const day =
    days === 0
      ? "Today"
      : days === 1
        ? "Tomorrow"
        : days > 1 && days < 7
          ? d.toLocaleDateString("en-IN", { weekday: "long" })
          : formatDate(d);
  return `${day} · ${timeLabel(d)}`;
}

export default async function StudentDashboardPage() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");
  const batch = await getActiveStudentBatch(session);
  if (!batch) redirect("/student");

  const studentId = session.user.id;
  const now = new Date();

  const [
    meetings,
    attendanceRows,
    myAttempts,
    activeTests,
    notes,
    notesTotal,
    fee,
    payments,
    liveSession,
    notices,
    enrolled,
    doubts,
    doubtsThisMonth,
  ] = await Promise.all([
    prisma.meeting.findMany({
      where: { batchId: batch.id },
      orderBy: { date: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
        durationMins: true,
        status: true,
      },
    }),
    prisma.attendance.findMany({
      where: { batchId: batch.id, studentId },
      select: { meetingId: true, status: true },
    }),
    prisma.testAttempt.findMany({
      where: { batchId: batch.id, studentId },
      orderBy: { submittedAt: "desc" },
      include: { test: { select: { title: true } } },
    }),
    prisma.test.findMany({
      where: { batchId: batch.id, isActive: true },
      include: {
        _count: { select: { questions: true } },
        attempts: { where: { studentId }, select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.note.findMany({
      where: { batchId: batch.id },
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: { id: true, title: true, subject: true, updatedAt: true },
    }),
    prisma.note.count({ where: { batchId: batch.id } }),
    prisma.fee.findUnique({
      where: { studentId_batchId: { studentId, batchId: batch.id } },
    }),
    prisma.payment.findMany({
      where: { studentId, batchId: batch.id },
      orderBy: { date: "asc" },
    }),
    prisma.liveSession.findFirst({ where: { batchId: batch.id, status: "live" } }),
    prisma.notice.findMany({
      where: { batchId: batch.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, text: true, createdAt: true },
    }),
    prisma.enrollment.count({ where: { batchId: batch.id, status: "APPROVED" } }),
    prisma.doubt.findMany({
      where: { studentId, liveSession: { batchId: batch.id } },
      orderBy: { timestamp: "desc" },
      take: 3,
      select: { doubtText: true, answer: true, timestamp: true },
    }),
    prisma.doubt.count({
      where: {
        studentId,
        liveSession: { batchId: batch.id },
        timestamp: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
      },
    }),
  ]);

  const attendanceByMeeting = new Map(attendanceRows.map((a) => [a.meetingId, a.status]));

  /* Ranks: pull every attempt for the tests this student attempted. */
  const attemptedTestIds = myAttempts.map((a) => a.testId);
  const cohortAttempts = attemptedTestIds.length
    ? await prisma.testAttempt.findMany({
        where: { testId: { in: attemptedTestIds } },
        select: { testId: true, score: true },
      })
    : [];
  const cohortByTest = new Map<string, number[]>();
  for (const a of cohortAttempts) {
    const list = cohortByTest.get(a.testId) ?? [];
    list.push(a.score);
    cohortByTest.set(a.testId, list);
  }

  /* A meeting is over once its scheduled span (plus a grace period) has
     passed, or the teacher explicitly ended it. */
  const isOver = (m: { date: Date; durationMins: number; status: string }) =>
    m.status === "ENDED" ||
    now.getTime() > m.date.getTime() + (m.durationMins + 30) * 60 * 1000;

  const liveMeeting = liveSession
    ? (meetings.find((m) => m.id === liveSession.roomId) ?? null)
    : null;

  /* ── The week strip (Mon..Sun of the current week) ── */
  const monday = startOfDay(new Date(now.getTime() - ((now.getDay() + 6) % 7) * DAY_MS));
  const meetingsWithAtt = meetings.map((m) => ({
    ...m,
    attended: attendanceByMeeting.has(m.id)
      ? attendanceByMeeting.get(m.id) === "PRESENT"
      : null,
  }));
  const week = WEEKDAYS.map((d, i) => {
    const day = new Date(monday.getTime() + i * DAY_MS);
    const dayMeetings = meetingsWithAtt.filter((m) => sameDay(m.date, day));
    return {
      d,
      n: day.getDate(),
      classes: dayMeetings.length,
      missed: dayMeetings.some((m) => m.attended === false),
      today: sameDay(day, now),
    };
  });

  /* ── Today's blocks (the live one becomes the cut-out, not a block) ── */
  const todayBlocks = meetingsWithAtt
    .filter((m) => sameDay(m.date, now) && m.id !== liveSession?.roomId)
    .map((m) => ({
      id: m.id,
      title: m.title,
      startAt: m.date.toISOString(),
      durationMins: m.durationMins,
      state: (isOver(m) ? "past" : "next") as "past" | "next",
      attended: m.attended,
      note: isOver(m) ? null : (m.description ?? null),
    }));

  /* ── Coming up: future meetings beyond today + the open test ── */
  const futureMeetings = meetings.filter(
    (m) => !sameDay(m.date, now) && m.date.getTime() > now.getTime() && !isOver(m)
  );
  const openTest =
    activeTests.find(
      (t) =>
        t.attempts.length === 0 &&
        (!t.closesAt || t.closesAt.getTime() > now.getTime())
    ) ?? null;
  const comingUp = [
    ...futureMeetings.slice(0, 3).map((m) => ({
      id: m.id,
      title: m.title,
      whenLabel: `${whenLabel(m.date, now)} · ${m.durationMins} min`,
      note: m.description ?? null,
      href: null,
    })),
    ...(openTest
      ? [
          {
            id: openTest.id,
            title: openTest.title,
            whenLabel: openTest.closesAt
              ? `Closes ${whenLabel(openTest.closesAt, now)} · ${openTest._count.questions} questions`
              : `Open now · ${openTest._count.questions} questions`,
            note: "One attempt",
            href: `/student/tests/${openTest.id}`,
          },
        ]
      : []),
  ].slice(0, 4);

  const nextMeeting =
    meetings.find(
      (m) => m.date.getTime() > now.getTime() && !isOver(m) && m.id !== liveSession?.roomId
    ) ?? null;

  /* ── Attendance (driven purely by marked registers) ── */
  const markedMeetings = meetingsWithAtt
    .filter((m) => m.attended !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const attended = markedMeetings.filter((m) => m.attended === true).length;
  const attendance =
    markedMeetings.length > 0
      ? {
          attended,
          total: markedMeetings.length,
          percent: Math.round((attended / markedMeetings.length) * 100),
          register: markedMeetings.map((m) => (m.attended ? 1 : 0)),
          missedCount: markedMeetings.length - attended,
        }
      : null;

  /* ── Fees ── */
  const paidPaise = payments.reduce((sum, p) => sum + p.amount, 0);
  const fees =
    fee && fee.totalAmount > 0
      ? {
          totalPaise: fee.totalAmount,
          paidPaise,
          duePaise: Math.max(fee.totalAmount - paidPaise, 0),
          dueLabel: fee.dueDate ? formatDate(fee.dueDate) : null,
          overdue:
            !!fee.dueDate &&
            fee.dueDate.getTime() < now.getTime() &&
            fee.totalAmount - paidPaise > 0,
          rows: payments.map((p, i) => ({
            id: p.id,
            label: p.note?.trim() || `Payment ${i + 1}`,
            onLabel: `${formatDate(p.date)} · ${p.method}`,
            amountPaise: p.amount,
          })),
        }
      : null;

  const teacherName = batch.teacher?.name ?? "your teacher";
  const firstName = (session.user.name ?? "Student").split(" ")[0];

  const data: DashboardData = {
    studentShort: firstName,
    // The course name already carries its domain ("Advanced NWP Modeling"),
    // so repeating batch.subject here produced "NWP Modeling Advanced NWP
    // Modeling (…)" — one run-on string with no separator.
    batchLine: [firstName, batch.name, teacherName].filter(Boolean).join(" · "),
    teacherName,
    enrolled,
    live:
      liveSession != null
        ? {
            meetingId: liveSession.roomId,
            title: liveMeeting?.title ?? "Live class",
            startAt: (liveSession.startedAt ?? liveMeeting?.date ?? now).toISOString(),
            durationMins: liveMeeting?.durationMins ?? 60,
            teacherJoined: liveSession.teacherJoined,
          }
        : null,
    nextClass: nextMeeting
      ? {
          title: nextMeeting.title,
          whenLabel: whenLabel(nextMeeting.date, now),
          durationMins: nextMeeting.durationMins,
          note: nextMeeting.description ?? null,
        }
      : null,
    week,
    todayBlocks,
    comingUp,
    results: myAttempts.map((a) => {
      const cohort = cohortByTest.get(a.testId) ?? [a.score];
      return {
        id: a.id,
        title: a.test.title,
        score: a.score,
        outOf: a.totalMarks,
        onLabel: formatDate(a.submittedAt),
        rank: 1 + cohort.filter((s) => s > a.score).length,
        cohort: cohort.length,
      };
    }),
    notes: {
      recent: notes.map((n) => ({
        id: n.id,
        title: n.title,
        updatedLabel: formatDate(n.updatedAt),
        subject: n.subject,
      })),
      total: notesTotal,
    },
    fees,
    attendance,
    notices: notices.map((n) => ({
      id: n.id,
      atLabel: formatDate(n.createdAt),
      text: n.text,
    })),
    doubts: {
      thisMonth: doubtsThisMonth,
      recent: doubts.map((d) => ({
        q: d.doubtText,
        onLabel: formatDate(d.timestamp),
        answered: d.answer.trim().length > 0,
      })),
    },
  };

  /* ── Feedback prompt: course has ended and no feedback left yet ── */
  const [courseMeta, existingFeedback] = await Promise.all([
    prisma.batch.findUnique({ where: { id: batch.id }, select: { endDate: true } }),
    prisma.feedback.findUnique({
      where: { batchId_traineeId: { batchId: batch.id, traineeId: studentId } },
      select: { id: true },
    }),
  ]);
  const showFeedbackPrompt =
    !!courseMeta?.endDate && courseMeta.endDate.getTime() < now.getTime() && !existingFeedback;

  return (
    <>
      <LiveRefresh
        channels={[batchChannel(batch.id)]}
        bindings={[
          { event: PUSHER_EVENTS.MEETING_STARTED, toastMessageKey: "meetingStarted" },
          { event: PUSHER_EVENTS.MEETING_ENDED, toastMessageKey: "meetingEnded" },
          { event: PUSHER_EVENTS.TEACHER_JOINED, toastMessageKey: "teacherJoined" },
        ]}
      />
      {showFeedbackPrompt && (
        <Link href="/student/feedback" className="mb-6 block">
          <Card className="flex items-center gap-3 transition-colors hover:border-hair-strong">
            <MessageSquareHeart aria-hidden="true" className="size-5 shrink-0 text-plum-600" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink-900">This course has ended — share your feedback</p>
              <p className="text-sm text-ink-500">Rate the course and trainer to help us improve.</p>
            </div>
          </Card>
        </Link>
      )}
      <StudentDashboard data={data} />
    </>
  );
}
