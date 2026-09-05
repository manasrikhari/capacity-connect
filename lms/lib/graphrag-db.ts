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

type Entry = { nodes: GraphNode[]; relations: GraphRelation[]; at: number };

/**
 * Keyed by scope, because knowledge is now either national (`batchId: null`)
 * or owned by one course. A trainee sees national plus their own course, so a
 * single global cache would leak another course's concepts into their answers.
 */
const cache = new Map<string, Entry>();
const NATIONAL_KEY = "__national__";
/** Bound the map; entries are small but the number of courses is not fixed. */
const MAX_CACHE_ENTRIES = 32;

/**
 * Load the graph visible to one scope: national nodes always, plus the given
 * course's nodes when a `batchId` is supplied. Defaults to national-only, so a
 * caller that forgets to pass a scope gets the safe, non-leaking answer.
 */
export async function loadGraph(batchId: string | null = null, force = false): Promise<Entry> {
  const key = batchId ?? NATIONAL_KEY;
  const hit = cache.get(key);
  if (!force && hit && Date.now() - hit.at < TTL_MS) return hit;

  const nodeRows = await prisma.knowledgeNode.findMany({
    where: batchId ? { OR: [{ batchId: null }, { batchId }] } : { batchId: null },
  });
  const visibleIds = new Set(nodeRows.map((n) => n.id));

  const relRows = await prisma.knowledgeRelation.findMany();

  const nodes: GraphNode[] = nodeRows.map((n) => ({
    id: n.id,
    name: n.name,
    type: n.type,
    category: n.category,
    description: n.description,
    metadata: (n.metadata as unknown as NodeMetadata | null) ?? null,
  }));
  // Drop edges that would dangle outside this scope. `traverse` already skips
  // unknown endpoints, but filtering keeps the adjacency map honest.
  const relations: GraphRelation[] = relRows
    .filter((r) => visibleIds.has(r.sourceId) && visibleIds.has(r.targetId))
    .map((r) => ({
      id: r.id,
      sourceId: r.sourceId,
      targetId: r.targetId,
      relationType: r.relationType,
      weight: r.weight,
    }));

  if (cache.size >= MAX_CACHE_ENTRIES) cache.clear();
  const entry: Entry = { nodes, relations, at: Date.now() };
  cache.set(key, entry);
  return entry;
}

/**
 * Called by the admin graph editor and by knowledge ingestion after any
 * change. Drops every scope: per-scope invalidation would need to know which
 * course a deleted node belonged to, and clearing is cheap at this size.
 */
export function invalidateGraphCache() {
  cache.clear();
}

export async function getKnowledgeContext(
  query: string,
  opts?: { maxHops?: number; maxPaths?: number; batchId?: string | null },
) {
  const { nodes, relations } = await loadGraph(opts?.batchId ?? null);
  const t0 = performance.now();
  const result = queryGraph(query, nodes, relations, opts);
  const tookMs = Math.round((performance.now() - t0) * 1000) / 1000;
  return { ...result, tookMs };
}
