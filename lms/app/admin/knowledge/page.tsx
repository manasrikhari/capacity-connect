import { redirect } from "next/navigation";
import { KnowledgeIngestForm } from "@/components/knowledge/KnowledgeIngestForm";
import { getActiveBatch } from "@/lib/batch";
import { hasFirecrawlKey } from "@/lib/firecrawl";
import { getSession } from "@/lib/session";

/** Model calls run inside the request, so give it room. */
export const maxDuration = 120;

export default async function TrainerKnowledgePage() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/");
  const batch = await getActiveBatch(session);
  if (!batch) redirect("/admin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-normal text-ink-900">Course knowledge</h1>
        <p className="mt-1 text-sm text-ink-500">
          Upload a PDF or paste a link and MeghDoot learns it. Everything is proposed for your
          review first, and only your trainees on {batch.name} will see what you add.
        </p>
      </div>
      <KnowledgeIngestForm linkEnabled={hasFirecrawlKey()} />
    </div>
  );
}
