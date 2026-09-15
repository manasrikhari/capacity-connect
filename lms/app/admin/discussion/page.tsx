import { redirect } from "next/navigation";
import { NewThreadForm } from "@/components/discussion/NewThreadForm";
import { ThreadList } from "@/components/discussion/ThreadList";
import { Card } from "@/components/ui/Card";
import { getActiveBatch } from "@/lib/batch";
import { listThreads, weekOptions } from "@/lib/discussion-db";
import { requireAdmin } from "@/lib/session";

export default async function AdminDiscussionPage() {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) redirect("/admin");

  const [threads, weeks] = await Promise.all([
    listThreads(batch.id),
    weekOptions(batch.id),
  ]);

  const unanswered = threads.filter((t) => !t.isResolved).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium text-ink-900">Discussion</h1>
          <p className="mt-1 text-sm text-ink-500">
            {unanswered === 0
              ? "Every question has an accepted answer."
              : `${unanswered} question${unanswered === 1 ? "" : "s"} without an accepted answer.`}
          </p>
        </div>
        <NewThreadForm batchId={batch.id} weeks={weeks} label="Post an announcement" />
      </div>

      <Card>
        <ThreadList threads={threads} basePath="/admin/discussion" />
      </Card>
    </div>
  );
}
