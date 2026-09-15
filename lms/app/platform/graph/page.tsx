import { redirect } from "next/navigation";
import { KnowledgeIngestForm } from "@/components/knowledge/KnowledgeIngestForm";
import {
  KnowledgeLibrary,
  type KnowledgeSourceRow,
} from "@/components/knowledge/KnowledgeLibrary";
import { hasFirecrawlKey } from "@/lib/firecrawl";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/** Extraction runs inside the request, so give it room. */
export const maxDuration = 120;

/** How many concept names to preview when a source row is expanded. */
const PREVIEW = 24;

export default async function PlatformKnowledgePage() {
  const session = await getSession();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/");

  const [rows, builtIn, builtInCount] = await Promise.all([
    prisma.knowledgeSource.findMany({
      where: { batchId: null },
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
    // Concepts that shipped with the platform rather than arriving in a
    // document. They are the bulk of the knowledge base, so they get a real
    // row rather than a footnote.
    prisma.knowledgeNode.findMany({
      where: { batchId: null, sourceId: null },
      select: { name: true },
      take: PREVIEW,
      orderBy: { name: "asc" },
    }),
    prisma.knowledgeNode.count({ where: { batchId: null, sourceId: null } }),
  ]);

  const sources: KnowledgeSourceRow[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    kind: r.kind,
    url: r.url,
    createdAt: r.createdAt.toISOString(),
    conceptCount: r._count.nodes,
    scope: "national",
    addedBy: r.addedBy?.name ?? null,
    concepts: r.nodes.map((n) => n.name),
  }));

  if (builtInCount > 0) {
    sources.push({
      id: "built-in",
      title: "Core meteorology knowledge",
      kind: "BUILT_IN",
      url: null,
      createdAt: null,
      conceptCount: builtInCount,
      scope: "national",
      addedBy: "Ships with the platform",
      concepts: builtIn.map((n) => n.name),
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-normal text-ink-900">Knowledge base</h1>
        <p className="mt-1 text-sm text-ink-500">
          Upload a PDF or paste a link and MeghDoot learns it. Everything you add here is national,
          so every course can cite it.
        </p>
      </div>

      <KnowledgeIngestForm linkEnabled={hasFirecrawlKey()} />
      <KnowledgeLibrary sources={sources} />
    </div>
  );
}
