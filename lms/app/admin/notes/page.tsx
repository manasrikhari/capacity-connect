import { redirect } from "next/navigation";
import { NotesManager } from "@/components/admin/NotesManager";
import { getSession } from "@/lib/session";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

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

  return <NotesManager notes={allNotes} />;
}
