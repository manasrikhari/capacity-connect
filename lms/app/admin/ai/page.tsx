import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { AiCompanion } from "@/components/ai/AiCompanion";

export default async function AdminAiPage() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

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
    <div className="space-y-6">
      {/* <div>
        <h1 className="text-2xl font-bold text-slate-800">OpenGrapes AI</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your batch AI teaching assistant and lesson Planner for {batch.name}.
        </p>
      </div> */}

      <AiCompanion
        batchId={batch.id}
        batchName={batch.name}
        userId={session.user.id}
        variant="admin"
        initialConversations={conversations}
        notes={notes}
        summaries={summaries}
        doubts={doubts}
      />
    </div>
  );
}
