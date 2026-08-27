import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getActiveStudentBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { AiCompanion } from "@/components/ai/AiCompanion";

export default async function StudentAiPage() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") {
    redirect("/");
  }

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
    <div className="space-y-6">
    {/* 
      <div>
        <h1 className="text-2xl font-bold text-slate-800">OpenGrapes AI</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your private, context-aware AI learning companion for {batch.name}.
        </p>
      </div>
    */}

      <AiCompanion
        batchId={batch.id}
        batchName={batch.name}
        userId={session.user.id}
        variant="student"
        initialConversations={conversations}
        notes={notes}
        summaries={summaries}
        doubts={doubts}
      />
    </div>
  );
}
