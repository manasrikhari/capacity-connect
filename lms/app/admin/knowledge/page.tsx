import { redirect } from "next/navigation";
import { KnowledgeIngestForm } from "@/components/knowledge/KnowledgeIngestForm";
import {
  KnowledgeLibrary,
  type KnowledgeSourceRow,
} from "@/components/knowledge/KnowledgeLibrary";
import { getActiveBatch } from "@/lib/batch";
import { hasFirecrawlKey } from "@/lib/firecrawl";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/** Extraction runs inside the request, so give it room. */
export const maxDuration = 120;

/** How many concept names to preview when a source row is expanded. */
const PREVIEW = 24;

export default async function TrainerKnowledgePage() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/");
  const batch = await getActiveBatch(session);
  if (!batch) redirect("/admin");

  const [rows, shared, sharedCount] = await Promise.all([
    prisma.knowledgeSource.findMany({
      where: { batchId: batch.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        kind: true,
        url: true,
        createdAt: true,
        addedBy: { select: { name: true } },
        nodes: { select: { name: true }, take: PREVIEW, orderBy: { name: "asc" } },
        _count: { select: { nodes: true } },
      },
    }),
    // National knowledge every course can already cite. Shown so a trainer can
    // see what MeghDoot knows before adding something that already exists.
    prisma.knowledgeNode.findMany({
      where: { batchId: null },
      select: { name: true },
      take: PREVIEW,
      orderBy: { name: "asc" },
    }),
    prisma.knowledgeNode.count({ where: { batchId: null } }),
  ]);

  const sources: KnowledgeSourceRow[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    kind: r.kind,
    url: r.url,
    createdAt: r.createdAt.toISOString(),
    conceptCount: r._count.nodes,
    scope: "course",
    addedBy: r.addedBy?.name ?? null,
    concepts: r.nodes.map((n) => n.name),
  }));

  if (sharedCount > 0) {
    sources.push({
      id: "built-in",
      title: "National knowledge base",
      kind: "BUILT_IN",
      url: null,
      createdAt: null,
      conceptCount: sharedCount,
      scope: "national",
      addedBy: "Shared across every course",
      concepts: shared.map((n) => n.name),
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-normal text-ink-900">Course knowledge</h1>
        <p className="mt-1 text-sm text-ink-500">
          Upload a PDF or paste a link and MeghDoot learns it. You review everything before it is
          saved, and only your trainees on {batch.name} will see what you add.
        </p>
      </div>

      <KnowledgeIngestForm linkEnabled={hasFirecrawlKey()} />
      <KnowledgeLibrary sources={sources} />
    </div>
  );
}
