import { redirect } from "next/navigation";
import { NewThreadForm } from "@/components/discussion/NewThreadForm";
import { ThreadList } from "@/components/discussion/ThreadList";
import { Card } from "@/components/ui/Card";
import { getActiveStudentBatch } from "@/lib/batch";
import { listThreads, weekOptions } from "@/lib/discussion-db";
import { getSession } from "@/lib/session";

export default async function StudentDiscussionPage() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const batch = await getActiveStudentBatch(session);
  if (!batch) redirect("/student");

  const [threads, weeks] = await Promise.all([
    listThreads(batch.id),
    weekOptions(batch.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium text-ink-900">Discussion</h1>
          <p className="mt-1 text-sm text-ink-500">
            Ask about anything in {batch.name}. Your trainer and everyone on the course can see and
            answer.
          </p>
        </div>
        <NewThreadForm batchId={batch.id} weeks={weeks} />
      </div>

      <Card>
        <ThreadList threads={threads} basePath="/student/discussion" />
      </Card>
    </div>
  );
}
