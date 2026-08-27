import { Link2, NotebookText } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getSession } from "@/lib/session";
import { getActiveStudentBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/utils";

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

  // Fetch corresponding meetings to get class name/title
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

  const exportedNotes = liveSessions.map((session) => {
    const meeting = meetingMap.get(session.roomId);
    const className = meeting?.title || "Class Session";
    const sessionTime = session.startedAt;
    const formattedTitle = `${className} - ${formatDateTime(sessionTime)}`;

    return {
      id: `exported-${session.roomId}`,
      title: formattedTitle,
      subject: "Live Class",
      content: `Handwritten whiteboard notes from class session.`,
      fileUrl: `https://opengrapes-whiteboard-sync.manasrikhari23.workers.dev/api/pdf/${session.roomId}`,
      updatedAt: session.endedAt || session.startedAt,
      isExported: true,
    };
  });

  const allNotes = [...parsedNotes, ...exportedNotes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Notes</h1>
        <p className="mt-1 text-sm text-slate-500">Browse study material shared by your teacher.</p>
      </div>

      {allNotes.length === 0 ? (
        <EmptyState icon={NotebookText} title="No notes yet" description="Your teacher hasn't shared any notes." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allNotes.map((note) => {
            const cardMarkup = (
              <Card className="flex h-full flex-col transition-shadow hover:shadow-md hover:shadow-violet-100 cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-slate-800 truncate max-w-[200px]" title={note.title}>
                    {note.title}
                  </h3>
                  <Badge color="violet">{note.subject}</Badge>
                </div>
                <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-500">{note.content}</p>
                {note.fileUrl && (
                  <span className="mt-2 inline-flex items-center gap-1 text-xs text-violet-600">
                    <Link2 className="size-3" />
                    Attachment
                  </span>
                )}
                <p className="mt-2 text-xs text-slate-400">Updated {formatDate(note.updatedAt)}</p>
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
