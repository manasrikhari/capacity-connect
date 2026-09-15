import Link from "next/link";
import { notFound } from "next/navigation";
import { ThreadView } from "@/components/discussion/ThreadView";
import { getThread } from "@/lib/discussion-db";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export default async function AdminThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdmin();
  const { id } = await params;

  const thread = await getThread(id);
  if (!thread) notFound();

  // Only the trainer who owns the course may moderate its forum.
  const batch = await prisma.batch.findFirst({
    where: { id: thread.batchId, teacherId: session.user.id },
    select: { id: true },
  });
  if (!batch) notFound();

  return (
    <div className="space-y-4">
      <Link href="/admin/discussion" className="text-sm text-ink-500 hover:text-ink-900">
        ← Back to discussion
      </Link>
      <ThreadView thread={thread} canModerate />
    </div>
  );
}
