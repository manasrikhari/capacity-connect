"use client";

import {
  Play,
  Square,
  Video,
  ClipboardList,
  FileDown,
  CalendarPlus,
  Pencil,
  Trash2,
  ClipboardCheck,
  Loader2,
} from "lucide-react";
import { useOptimistic, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { setMeetingStatus, deleteMeeting } from "@/app/admin/meetings/actions";
import { startClassAction } from "@/app/actions/meeting";
import type { Meeting, LiveSession } from "@/app/generated/prisma/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { MeetingFormModal } from "@/components/admin/MeetingFormModal";
import {
  AttendanceManager,
  type RosterStudent,
} from "@/components/admin/AttendanceManager";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatDateTime, getEffectiveMeetingStatus } from "@/lib/utils";
import { whiteboardPdfUrl } from "@/lib/whiteboard";

type LiveSessionRow = {
  roomId: string;
  status: string;
  hasNotes: boolean;
  meetingMinutes: { content: string } | null;
};

type AttendanceRow = {
  meetingId: string;
  studentId: string;
  status: "PRESENT" | "ABSENT";
};

export function MeetingsManager({
  meetings,
  liveSession,
  liveSessions,
  students,
  attendance,
  batchId,
}: {
  meetings: Meeting[];
  liveSession: LiveSession | null;
  liveSessions: LiveSessionRow[];
  students: RosterStudent[];
  attendance: AttendanceRow[];
  batchId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [starting, startStartTransition] = useTransition();
  const [deleting, startDeleteTransition] = useTransition();
  const [optimisticLive, setOptimisticLive] = useOptimistic(!!liveSession);
  const [activeMoM, setActiveMoM] = useState<{ title: string; content: string } | null>(null);
  const [visibleCount, setVisibleCount] = useState(4);
  const [formMeeting, setFormMeeting] = useState<Meeting | null | undefined>(undefined);
  const [attendanceMeeting, setAttendanceMeeting] = useState<Meeting | null>(null);
  const router = useRouter();

  const activeMeeting = liveSession
    ? meetings.find((m) => m.id === liveSession.roomId)
    : null;

  const sessionMap = new Map(
    liveSessions.map((ls) => [
      ls.roomId,
      {
        hasNotes: ls.hasNotes === true,
        minutes: ls.meetingMinutes?.content || null,
        status: ls.status,
      },
    ])
  );

  // meetingId -> attendance rows
  const attendanceMap = new Map<string, AttendanceRow[]>();
  for (const row of attendance) {
    const list = attendanceMap.get(row.meetingId) ?? [];
    list.push(row);
    attendanceMap.set(row.meetingId, list);
  }

  const liveRoomId = liveSession?.roomId;

  function isPast(m: Meeting) {
    if (m.id === liveRoomId) return false;
    const sd = sessionMap.get(m.id);
    if (sd && sd.status !== "live") return true;
    return getEffectiveMeetingStatus(m) === "ENDED";
  }

  const pastMeetings = meetings.filter(isPast);
  const upcomingMeetings = meetings.filter(
    (m) => m.id !== liveRoomId && !isPast(m)
  );

  function handleStartClass() {
    startStartTransition(async () => {
      setOptimisticLive(true);
      const result = await startClassAction(batchId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
      router.refresh();
    });
  }

  function handleEndMeeting(id: string) {
    if (!confirm("Are you sure you want to end this class?")) return;
    startTransition(async () => {
      setOptimisticLive(false);
      const result = await setMeetingStatus(id, "ENDED");
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Class session ended");
      }
    });
  }

  function handleDelete(meeting: Meeting) {
    if (!confirm(`Delete "${meeting.title}"? This cannot be undone.`)) return;
    startDeleteTransition(async () => {
      const result = await deleteMeeting(meeting.id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Class deleted");
        router.refresh();
      }
    });
  }

  const visibleMeetings = pastMeetings.slice(0, visibleCount);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl text-ink-900">Meetings</h1>
          <p className="mt-1 text-sm text-ink-500">
            Schedule classes, run live sessions, and mark attendance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={() => setFormMeeting(null)}>
            <CalendarPlus className="size-4" />
            Schedule class
          </Button>
          {!optimisticLive && (
            <Button type="button" variant="primary" loading={starting} onClick={handleStartClass}>
              <Play className="size-4" />
              Start class
            </Button>
          )}
        </div>
      </div>

      {/* The board — the one raised, dark surface, only for what is live now. */}
      {optimisticLive && (
        <section
          className="relative overflow-hidden rounded-3xl border border-board-edge bg-board p-6 text-chalk"
          style={{ boxShadow: "var(--shadow-lg)" }}
        >
          <div
            className="pointer-events-none absolute inset-0 text-chalk/5 bg-dot-grid"
            aria-hidden
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-muted">
                <span
                  className="inline-block size-2 rounded-full bg-status-live"
                  style={{ animation: "live-pulse 1.8s var(--ease-out) infinite" }}
                />
                Live now
              </div>
              <h2 className="text-2xl text-chalk">
                {activeMeeting?.title || "Active class"}
              </h2>
              {liveSession ? (
                <p className="font-mono text-xs text-chalk-muted">
                  Started {formatDateTime(liveSession.startedAt)}
                </p>
              ) : (
                <p className="text-sm text-chalk-muted">Starting class…</p>
              )}
            </div>
            {liveSession && (
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  disabled={starting}
                  onClick={handleStartClass}
                  className="inline-flex items-center gap-1.5 rounded-[10px] bg-chalk px-4 py-2 text-sm font-medium text-board transition-[background-color,scale] duration-[var(--dur-press)] ease-[var(--ease-out)] hover:bg-chalk/90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                >
                  {starting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Video className="size-3.5" />
                  )}
                  Rejoin
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleEndMeeting(liveSession.roomId)}
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-chalk/30 px-4 py-2 text-sm font-medium text-chalk transition-[background-color,scale] duration-[var(--dur-press)] ease-[var(--ease-out)] hover:bg-chalk/10 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                >
                  {pending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Square className="size-3.5" />
                  )}
                  End class
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Scheduled / upcoming classes */}
      <section className="space-y-3">
        <h2 className="border-b border-hair-strong pb-2 text-sm font-semibold text-ink-900">
          Scheduled classes
        </h2>
        {upcomingMeetings.length === 0 ? (
          <EmptyState
            icon={CalendarPlus}
            title="No classes scheduled"
            description="Schedule an upcoming class so students know when to show up."
            action={
              <Button type="button" variant="secondary" onClick={() => setFormMeeting(null)}>
                <CalendarPlus className="size-4" />
                Schedule class
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-hair rounded-2xl border border-hair bg-paper">
            {upcomingMeetings.map((meeting) => (
              <li key={meeting.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="truncate text-base text-ink-900" title={meeting.title}>
                    {meeting.title}
                  </h3>
                  <p className="font-mono text-[11px] text-ink-300">
                    {formatDateTime(meeting.date)} · {meeting.durationMins} min
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Badge color="violet">Scheduled</Badge>
                  <button
                    type="button"
                    onClick={() => setFormMeeting(meeting)}
                    className="rounded-[8px] p-2 text-ink-500 transition-colors hover:bg-plum-50 hover:text-plum-700 cursor-pointer"
                    title="Edit class"
                    aria-label="Edit class"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => handleDelete(meeting)}
                    className="rounded-[8px] p-2 text-ink-500 transition-colors hover:bg-status-unpaid/10 hover:text-status-unpaid disabled:opacity-50 cursor-pointer"
                    title="Delete class"
                    aria-label="Delete class"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Past classes */}
      <section className="space-y-3">
        <h2 className="border-b border-hair-strong pb-2 text-sm font-semibold text-ink-900">
          Past classes
        </h2>
        {pastMeetings.length === 0 ? (
          <EmptyState
            icon={Video}
            title="No past classes"
            description="Ended live class sessions will be listed here."
          />
        ) : (
          <ul className="divide-y divide-hair rounded-2xl border border-hair bg-paper">
            {visibleMeetings.map((meeting) => {
              const sessionDetails = sessionMap.get(meeting.id);
              const hasNotes = sessionDetails?.hasNotes ?? false;
              const minutes = sessionDetails?.minutes ?? null;
              const rows = attendanceMap.get(meeting.id) ?? [];
              const marked = rows.length > 0;
              const presentCount = rows.filter((r) => r.status === "PRESENT").length;

              return (
                <li key={meeting.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="truncate text-base text-ink-900" title={meeting.title}>
                      {meeting.title}
                    </h3>
                    <p className="font-mono text-[11px] text-ink-300">
                      {formatDateTime(meeting.date)} · {meeting.durationMins} min
                    </p>
                    <p className="text-xs text-ink-500">
                      {students.length === 0
                        ? "No students enrolled"
                        : marked
                          ? `Attendance: ${presentCount}/${students.length} present`
                          : "Attendance not marked"}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={marked ? "outline" : "secondary"}
                      onClick={() => setAttendanceMeeting(meeting)}
                    >
                      <ClipboardCheck className="size-3.5" />
                      {marked ? "Edit attendance" : "Mark attendance"}
                    </Button>

                    {minutes ? (
                      <button
                        type="button"
                        onClick={() => setActiveMoM({ title: meeting.title, content: minutes })}
                        className="rounded-[8px] p-2 text-plum-700 transition-colors hover:bg-plum-50 cursor-pointer"
                        title="View minutes of meeting"
                        aria-label="View minutes of meeting"
                      >
                        <ClipboardList className="size-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="cursor-not-allowed rounded-[8px] p-2 text-ink-300 opacity-40"
                        title="No minutes available"
                        aria-label="No minutes available"
                      >
                        <ClipboardList className="size-4" />
                      </button>
                    )}

                    {hasNotes ? (
                      <a
                        href={whiteboardPdfUrl(meeting.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-[8px] p-2 text-plum-700 transition-colors hover:bg-plum-50 cursor-pointer"
                        title="Download class notes PDF"
                        aria-label="Download class notes PDF"
                      >
                        <FileDown className="size-4" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="cursor-not-allowed rounded-[8px] p-2 text-ink-300 opacity-40"
                        title="No notes available"
                        aria-label="No notes available"
                      >
                        <FileDown className="size-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setFormMeeting(meeting)}
                      className="rounded-[8px] p-2 text-ink-500 transition-colors hover:bg-plum-50 hover:text-plum-700 cursor-pointer"
                      title="Edit class"
                      aria-label="Edit class"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => handleDelete(meeting)}
                      className="rounded-[8px] p-2 text-ink-500 transition-colors hover:bg-status-unpaid/10 hover:text-status-unpaid disabled:opacity-50 cursor-pointer"
                      title="Delete class"
                      aria-label="Delete class"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              );
            })}

            {pastMeetings.length > visibleCount && (
              <li className="flex justify-center p-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setVisibleCount((prev) => prev + 4)}
                >
                  Load more classes
                </Button>
              </li>
            )}
          </ul>
        )}
      </section>

      {/* Schedule / edit class form */}
      <MeetingFormModal
        key={formMeeting === undefined ? "form-closed" : formMeeting ? `edit-${formMeeting.id}` : "form-new"}
        open={formMeeting !== undefined}
        onClose={() => setFormMeeting(undefined)}
        meeting={formMeeting ?? undefined}
      />

      {/* Attendance roster */}
      <Modal
        open={!!attendanceMeeting}
        onClose={() => setAttendanceMeeting(null)}
        title={`Attendance: ${attendanceMeeting?.title ?? ""}`}
      >
        {attendanceMeeting && (
          <AttendanceManager
            meetingId={attendanceMeeting.id}
            students={students}
            existing={attendanceMap.get(attendanceMeeting.id) ?? []}
            onSaved={() => {
              setAttendanceMeeting(null);
              router.refresh();
            }}
          />
        )}
      </Modal>

      {/* Minutes of meeting */}
      <Modal
        open={!!activeMoM}
        onClose={() => setActiveMoM(null)}
        title={`Minutes of meeting: ${activeMoM?.title || ""}`}
      >
        {activeMoM && (
          <div className="max-h-[60vh] overflow-y-auto rounded-2xl border border-hair bg-sunken/40 p-6 text-sm leading-relaxed scrollbar-thin">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className="mt-4 mb-2 border-b border-hair pb-1 text-lg font-semibold text-ink-900">{children}</h1>,
                h2: ({ children }) => <h2 className="mt-3 mb-1.5 text-base font-semibold text-ink-900">{children}</h2>,
                h3: ({ children }) => <h3 className="mt-2 mb-1 text-sm font-semibold text-ink-700">{children}</h3>,
                p: ({ children }) => <p className="my-2 text-sm leading-relaxed text-ink-700">{children}</p>,
                ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5 text-sm text-ink-700">{children}</ul>,
                ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5 text-sm text-ink-700">{children}</ol>,
                li: ({ children }) => <li className="pl-1">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-ink-900">{children}</strong>,
                table: ({ children }) => (
                  <div className="my-3 overflow-x-auto rounded-lg border border-hair">
                    <table className="min-w-full divide-y divide-hair text-left text-sm">{children}</table>
                  </div>
                ),
                thead: ({ children }) => <thead className="bg-sunken font-semibold text-ink-700">{children}</thead>,
                tbody: ({ children }) => <tbody className="divide-y divide-hair">{children}</tbody>,
                tr: ({ children }) => <tr className="hover:bg-sunken/30">{children}</tr>,
                th: ({ children }) => <th className="border-b border-hair px-3 py-2 font-semibold">{children}</th>,
                td: ({ children }) => <td className="px-3 py-2 text-ink-700">{children}</td>,
              }}
            >
              {activeMoM.content}
            </ReactMarkdown>
          </div>
        )}
      </Modal>
    </div>
  );
}
