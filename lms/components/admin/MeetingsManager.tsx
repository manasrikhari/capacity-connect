"use client";

import { Play, Square, Video, ClipboardList, FileDown } from "lucide-react";
import { useOptimistic, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { setMeetingStatus } from "@/app/admin/meetings/actions";
import { startClassAction } from "@/app/actions/meeting";
import type { Meeting, LiveSession } from "@/app/generated/prisma/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatDateTime, getEffectiveMeetingStatus } from "@/lib/utils";

export function MeetingsManager({
  meetings,
  liveSession,
  liveSessions,
  batchId,
}: {
  meetings: Meeting[];
  liveSession: LiveSession | null;
  liveSessions: any[];
  batchId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [starting, startStartTransition] = useTransition();
  const [optimisticLive, setOptimisticLive] = useOptimistic(!!liveSession);
  const [activeMoM, setActiveMoM] = useState<{ title: string; content: string } | null>(null);
  const [visibleCount, setVisibleCount] = useState(4);
  const router = useRouter();

  const activeMeeting = liveSession
    ? meetings.find((m) => m.id === liveSession.roomId)
    : null;

  // Map liveSession roomId to details
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

  const pastMeetings = meetings.filter((m) => {
    if (m.id === liveSession?.roomId) return false;

    const sessionDetails = sessionMap.get(m.id);
    if (sessionDetails && sessionDetails.status !== "live") return true;

    return getEffectiveMeetingStatus(m) === "ENDED";
  });

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
        toast.success("Class session ended successfully");
      }
    });
  }

  const visibleMeetings = pastMeetings.slice(0, visibleCount);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Meetings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Start live sessions and manage class history.
          </p>
        </div>
        {!optimisticLive && (
          <Button type="button" variant="primary" loading={starting} onClick={handleStartClass}>
            <Play className="size-4" />
            Start Class
          </Button>
        )}
      </div>

      {/* Active Session Card */}
      {optimisticLive && (
        <Card className="border-emerald-200 bg-emerald-50/30">
          {liveSession ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge color="green" className="animate-pulse">
                    ● LIVE NOW
                  </Badge>
                  <h3 className="font-semibold text-slate-800">
                    {activeMeeting?.title || "Active Class"}
                  </h3>
                </div>
                <p className="text-sm text-slate-500">
                  Class is currently in progress. Students can join from their dashboard.
                </p>
                <p className="text-xs text-slate-400">
                  Started at {formatDateTime(liveSession.startedAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant="secondary" loading={starting} onClick={handleStartClass}>
                  <Video className="size-3.5" /> Rejoin
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  loading={pending}
                  onClick={() => handleEndMeeting(liveSession.roomId)}
                  className="border-rose-200 text-rose-700 hover:bg-rose-50"
                >
                  <Square className="size-3.5" /> End Class
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Badge color="green" className="animate-pulse">● LIVE NOW</Badge>
              Starting class…
            </div>
          )}
        </Card>
      )}

      {/* Past History */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-700">Past Classes</h2>
        {pastMeetings.length === 0 ? (
          <EmptyState
            icon={Video}
            title="No past classes"
            description="All your ended live class sessions will be displayed here."
          />
        ) : (
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-100 bg-white">
            {visibleMeetings.map((meeting) => {
              const sessionDetails = sessionMap.get(meeting.id);
              const hasNotes = sessionDetails?.hasNotes ?? false;
              const minutes = sessionDetails?.minutes ?? null;

              return (
                <div
                  key={meeting.id}
                  className="flex items-center justify-between p-4 gap-4"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <h4 className="font-medium text-slate-800 truncate" title={meeting.title}>
                      {meeting.title}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Ended on {formatDateTime(meeting.date)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {/* Minutes of Meeting (MoM) Dialog Trigger */}
                    {minutes ? (
                      <button
                        type="button"
                        onClick={() => setActiveMoM({ title: meeting.title, content: minutes })}
                        className="p-2 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors cursor-pointer"
                        title="View Minutes of Meeting (MoM)"
                      >
                        <ClipboardList className="size-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="p-2 rounded-lg bg-slate-50 text-slate-350 opacity-40 cursor-not-allowed"
                        title="No Minutes of Meeting (MoM) available for class"
                      >
                        <ClipboardList className="size-4" />
                      </button>
                    )}

                    {/* Whiteboard Notes PDF Download */}
                    {hasNotes ? (
                      <a
                        href={`https://opengrapes-whiteboard-sync.manasrikhari23.workers.dev/api/pdf/${meeting.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors cursor-pointer"
                        title="Download Class Notes PDF"
                      >
                        <FileDown className="size-4" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="p-2 rounded-lg bg-slate-50 text-slate-350 opacity-40 cursor-not-allowed"
                        title="No notes available for class"
                      >
                        <FileDown className="size-4" />
                      </button>
                    )}

                    <Badge color="slate">Ended</Badge>
                  </div>
                </div>
              );
            })}

            {pastMeetings.length > visibleCount && (
              <div className="flex justify-center p-3 border-t border-slate-50 bg-slate-50/10">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 4)}
                  className="px-4 py-2 text-xs font-semibold text-violet-600 hover:text-violet-750 bg-violet-50 hover:bg-violet-100/80 rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Load More Meetings
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MoM Content Lightbox Dialog */}
      <Modal
        open={!!activeMoM}
        onClose={() => setActiveMoM(null)}
        title={`Minutes of Meeting: ${activeMoM?.title || ""}`}
      >
        {activeMoM && (
          <div className="space-y-4">
            <div className="text-sm leading-relaxed bg-slate-50 p-6 border border-slate-100 rounded-xl max-h-[60vh] overflow-y-auto scrollbar-thin">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 className="text-lg font-bold text-violet-750 border-b border-violet-100/50 pb-1 mt-4 mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-semibold text-slate-800 mt-3 mb-1.5">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold text-slate-700 mt-2 mb-1">{children}</h3>,
                  p: ({ children }) => <p className="text-sm leading-relaxed text-slate-600 my-2">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 my-2 text-slate-650 text-sm">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 my-2 text-slate-650 text-sm">{children}</ol>,
                  li: ({ children }) => <li className="pl-1">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-3 rounded-lg border border-slate-200">
                      <table className="min-w-full divide-y divide-slate-200 text-sm text-left">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => <thead className="bg-slate-50 text-slate-700 font-semibold">{children}</thead>,
                  tbody: ({ children }) => <tbody className="divide-y divide-slate-200">{children}</tbody>,
                  tr: ({ children }) => <tr className="hover:bg-slate-50/30">{children}</tr>,
                  th: ({ children }) => <th className="px-3 py-2 border-b border-slate-200 font-bold">{children}</th>,
                  td: ({ children }) => <td className="px-3 py-2 text-slate-600">{children}</td>,
                }}
              >
                {activeMoM.content}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
