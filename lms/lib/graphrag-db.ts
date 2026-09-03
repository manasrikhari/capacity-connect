import "server-only";
import { prisma } from "@/lib/prisma";
import {
  queryGraph,
  type GraphNode,
  type GraphRelation,
  type NodeMetadata,
} from "@/lib/graphrag";

// The whole demo graph is a few KB; two findMany calls cached for 60s give
// sub-millisecond in-memory BFS with no vector DB. Swap in a pgvector seed
// finder here if the graph ever grows past ~10k nodes.
const TTL_MS = 60_000;
let cache: { nodes: GraphNode[]; relations: GraphRelation[]; at: number } | null = null;

export async function loadGraph(force = false) {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache;
  const [nodeRows, relRows] = await Promise.all([
    prisma.knowledgeNode.findMany(),
    prisma.knowledgeRelation.findMany(),
  ]);
  const nodes: GraphNode[] = nodeRows.map((n) => ({
    id: n.id,
    name: n.name,
    type: n.type,
    category: n.category,
    description: n.description,
    metadata: (n.metadata as unknown as NodeMetadata | null) ?? null,
  }));
  const relations: GraphRelation[] = relRows.map((r) => ({
    id: r.id,
    sourceId: r.sourceId,
    targetId: r.targetId,
    relationType: r.relationType,
    weight: r.weight,
  }));
  cache = { nodes, relations, at: Date.now() };
  return cache;
}

/** Called by the admin graph editor after any node/relation change. */
export function invalidateGraphCache() {
  cache = null;
}

export async function getKnowledgeContext(
  query: string,
  opts?: { maxHops?: number; maxPaths?: number },
) {
  const { nodes, relations } = await loadGraph();
  const t0 = performance.now();
  const result = queryGraph(query, nodes, relations, opts);
  const tookMs = Math.round((performance.now() - t0) * 1000) / 1000;
  return { ...result, tookMs };
}
