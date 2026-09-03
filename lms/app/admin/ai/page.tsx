import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AiCompanion } from "@/components/ai/AiCompanion";

export default async function AdminAiPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const { mode } = await searchParams;
  const isMeghDoot = mode === "meghdoot";

  const batch = await getActiveBatch(session);
  if (!batch) {
    redirect("/admin");
  }

  // Load chat threads, notes, and session context for the teacher
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
      studentId: session.user.id, // Only user's own doubts (keeps doubts strictly private per discussion)
    },
    orderBy: { timestamp: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center gap-1 rounded-[10px] border border-hair bg-sunken/40 p-1">
        <Link
          href="/admin/ai"
          className={`rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-colors ${
            !isMeghDoot
              ? "bg-paper text-plum-700 shadow-[var(--shadow-sm)]"
              : "text-ink-500 hover:text-ink-900"
          }`}
        >
          Course assistant
        </Link>
        <Link
          href="/admin/ai?mode=meghdoot"
          className={`rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-colors ${
            isMeghDoot
              ? "bg-paper text-plum-700 shadow-[var(--shadow-sm)]"
              : "text-ink-500 hover:text-ink-900"
          }`}
        >
          MeghDoot Copilot
        </Link>
      </div>

      <AiCompanion
        batchId={batch.id}
        batchName={batch.name}
        userId={session.user.id}
        variant="admin"
        initialConversations={conversations}
        notes={notes}
        summaries={summaries}
        doubts={doubts}
        mode={isMeghDoot ? "meghdoot" : "classroom"}
      />
    </div>
  );
}
