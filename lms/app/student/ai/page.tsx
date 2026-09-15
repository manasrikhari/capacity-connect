import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getActiveStudentBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AiCompanion } from "@/components/ai/AiCompanion";

export default async function StudentAiPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") {
    redirect("/");
  }

  const { mode } = await searchParams;
  const isMeghDoot = mode === "meghdoot";

  const batch = await getActiveStudentBatch(session);
  if (!batch) {
    redirect("/student");
  }

  // Load chat threads, notes, and session context for the student
  const [conversations, notes, sessions] = await Promise.all([
    prisma.aiConversation.findMany({
      where: { userId: session.user.id, batchId: batch.id },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.note.findMany({
      where: { batchId: batch.id },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.liveSession.findMany({
      where: { batchId: batch.id },
      include: { meetingMinutes: true },
    }),
  ]);

  const summaries = sessions
    .filter((s) => s.meetingMinutes)
    .map((s) => ({
      id: s.roomId,
      content: s.meetingMinutes!.content,
    }));

  const doubts = await prisma.doubt.findMany({
    where: {
      sessionId: { in: sessions.map((s) => s.roomId) },
      studentId: session.user.id,
    },
    orderBy: { timestamp: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center gap-1 rounded-[10px] border border-hair bg-sunken/40 p-1">
        <Link
          href="/student/ai"
          className={`rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-colors ${
            !isMeghDoot
              ? "bg-paper text-plum-700 shadow-[var(--shadow-sm)]"
              : "text-ink-500 hover:text-ink-900"
          }`}
        >
          Course materials
        </Link>
        <Link
          href="/student/ai?mode=meghdoot"
          className={`rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-colors ${
            isMeghDoot
              ? "bg-paper text-plum-700 shadow-[var(--shadow-sm)]"
              : "text-ink-500 hover:text-ink-900"
          }`}
        >
          Knowledge base
        </Link>
      </div>

      <AiCompanion
        batchId={batch.id}
        batchName={batch.name}
        userId={session.user.id}
        variant="student"
        initialConversations={conversations}
        notes={notes}
        summaries={summaries}
        doubts={doubts}
        mode={isMeghDoot ? "meghdoot" : "classroom"}
      />
    </div>
  );
}
