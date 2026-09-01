import { redirect } from "next/navigation";
import { NotesManager } from "@/components/admin/NotesManager";
import { getSession } from "@/lib/session";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { whiteboardPdfUrl } from "@/lib/whiteboard";

export default async function AdminNotesPage() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/");
  const batch = await getActiveBatch(session);
  if (!batch) redirect("/admin");

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

  return <NotesManager notes={allNotes} />;
}
