"use client";

import { useState } from "react";
import { ClipboardList, FileDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDateTime } from "@/lib/utils";
import { whiteboardPdfUrl } from "@/lib/whiteboard";

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  date: Date | string;
  durationMins: number;
  status: string;
}

interface LiveSession {
  id: string;
  roomId: string;
  hasNotes: boolean;
  meetingMinutes?: {
    content: string;
  } | null;
}

interface AttendanceRecord {
  meetingId: string;
  status: "PRESENT" | "ABSENT";
}

interface MeetingsListProps {
  meetings: Meeting[];
  liveSessions: LiveSession[];
  attendance: AttendanceRecord[];
}

export function MeetingsList({ meetings, liveSessions, attendance }: MeetingsListProps) {
  const [activeMoM, setActiveMoM] = useState<{ title: string; content: string } | null>(null);
  const [visibleCount, setVisibleCount] = useState(4);

  // Map liveSession roomId to details
  const sessionMap = new Map(
    liveSessions.map((ls) => [
      ls.roomId,
      {
        hasNotes: ls.hasNotes === true,
        minutes: ls.meetingMinutes?.content || null,
      },
    ])
  );

  const attendanceMap = new Map(attendance.map((a) => [a.meetingId, a.status]));

  const visibleMeetings = meetings.slice(0, visibleCount);

  return (
    <ul className="divide-y divide-hair rounded-2xl border border-hair bg-paper">
      {visibleMeetings.map((meeting) => {
        const sessionDetails = sessionMap.get(meeting.id);
        const hasNotes = sessionDetails?.hasNotes ?? false;
        const minutes = sessionDetails?.minutes ?? null;
        const attendanceStatus = attendanceMap.get(meeting.id);

        return (
          <li key={meeting.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="truncate text-base text-ink-900" title={meeting.title}>
                {meeting.title}
              </h3>
              <p className="font-mono text-[11px] text-ink-300">
                {formatDateTime(meeting.date)} · {meeting.durationMins} min
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2.5">
              {/* Minutes of Meeting (MoM) Dialog Trigger */}
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

              {/* Whiteboard Notes PDF Download */}
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

              {attendanceStatus === "PRESENT" ? (
                <Badge color="green">Attended</Badge>
              ) : attendanceStatus === "ABSENT" ? (
                <Badge color="red">Missed</Badge>
              ) : (
                <Badge color="slate">Ended</Badge>
              )}
            </div>
          </li>
        );
      })}

      {meetings.length > visibleCount && (
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

      {/* MoM Content Lightbox Dialog */}
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
    </ul>
  );
}
