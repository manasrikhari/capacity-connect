import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ThreadView } from "@/components/discussion/ThreadView";
import { getThread } from "@/lib/discussion-db";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export default async function StudentThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const { id } = await params;
  const thread = await getThread(id);
  if (!thread) notFound();

  // A thread is only readable by someone actually on the course — the id alone
  // must not be enough.
  const enrolment = await prisma.enrollment.findUnique({
    where: { studentId_batchId: { studentId: session.user.id, batchId: thread.batchId } },
    select: { status: true },
  });
  if (enrolment?.status !== "APPROVED") notFound();

  return (
    <div className="space-y-4">
      <Link href="/student/discussion" className="text-sm text-ink-500 hover:text-ink-900">
        ← Back to discussion
      </Link>
      <ThreadView thread={thread} canModerate={false} />
    </div>
  );
}
