import { Link2, NotebookText } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MathText } from "@/components/ui/MathText";
import { markdownExcerpt } from "@/lib/math-segments";
import { getSession } from "@/lib/session";
import { getActiveStudentBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/utils";
import { whiteboardPdfUrl } from "@/lib/whiteboard";

export default async function StudentNotesPage() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");
  const batch = await getActiveStudentBatch(session);
  if (!batch) redirect("/student");

  const [notes, liveSessions] = await Promise.all([
    prisma.note.findMany({
      where: { batchId: batch.id },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.liveSession.findMany({
      where: { batchId: batch.id, hasNotes: true },
      orderBy: { endedAt: "desc" },
    }),
  ]);

  // Fetch corresponding meetings to get the class name/title.
  const meetings = await prisma.meeting.findMany({
    where: { id: { in: liveSessions.map((s) => s.roomId) } },
  });
  const meetingMap = new Map(meetings.map((m) => [m.id, m]));

  const parsedNotes = notes.map((n) => ({
    id: n.id,
    title: n.title,
    subject: n.subject,
    content: n.content,
    fileUrl: n.fileUrl,
    updatedAt: n.updatedAt,
    isExported: false,
  }));

  const exportedNotes = liveSessions.map((liveSession) => {
    const meeting = meetingMap.get(liveSession.roomId);
    const className = meeting?.title || "Class session";
    const formattedTitle = `${className} — ${formatDateTime(liveSession.startedAt)}`;

    return {
      id: `exported-${liveSession.roomId}`,
      title: formattedTitle,
      subject: "Live class",
      content: "Handwritten whiteboard notes from a class session.",
      fileUrl: whiteboardPdfUrl(liveSession.roomId),
      updatedAt: liveSession.endedAt || liveSession.startedAt,
      isExported: true,
    };
  });

  const allNotes = [...parsedNotes, ...exportedNotes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-ink-900">Notes</h1>
        <p className="mt-1 text-sm text-ink-500">Browse study material shared by your teacher.</p>
      </div>

      {allNotes.length === 0 ? (
        <EmptyState icon={NotebookText} title="No notes yet" description="Your teacher hasn't shared any notes." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allNotes.map((note) => {
            const cardMarkup = (
              <Card className="flex h-full cursor-pointer flex-col transition-colors hover:border-hair-strong">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="min-w-0 truncate font-medium text-ink-900" title={note.title}>
                    {note.title}
                  </h3>
                  <Badge color="violet">{note.subject}</Badge>
                </div>
                <p className="mt-2 line-clamp-3 flex-1 text-sm text-ink-500">
                  <MathText text={markdownExcerpt(note.content)} />
                </p>
                {note.fileUrl && (
                  <span className="mt-2 inline-flex items-center gap-1 text-xs text-plum-700">
                    <Link2 className="size-3" />
                    Attachment
                  </span>
                )}
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                  Updated {formatDate(note.updatedAt)}
                </p>
              </Card>
            );

            if (note.isExported) {
              return (
                <a key={note.id} href={note.fileUrl || "#"} target="_blank" rel="noopener noreferrer">
                  {cardMarkup}
                </a>
              );
            }

            return (
              <Link key={note.id} href={`/student/notes/${note.id}`}>
                {cardMarkup}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
