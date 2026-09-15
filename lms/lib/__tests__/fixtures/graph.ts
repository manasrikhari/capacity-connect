// Deterministic in-memory fixture built from the shared demo knowledge graph.
// Node i (array order) → id `n${i+1}`; relation i → id `r${i+1}`. Relation
// source/target names are resolved to node ids; weight defaults to 1. This lets
// the GraphRAG unit tests run with stable ids and no database.

import {
  KNOWLEDGE_NODES,
  KNOWLEDGE_RELATIONS,
} from "@/lib/knowledge-graph-data";
import type { GraphNode, GraphRelation } from "@/lib/graphrag";

export type Fixture = {
  nodes: GraphNode[];
  relations: GraphRelation[];
  nodesById: Map<string, GraphNode>;
};

export function buildFixture(): Fixture {
  const nodes: GraphNode[] = KNOWLEDGE_NODES.map((n, i) => ({
    id: `n${i + 1}`,
    name: n.name,
    type: n.type,
    category: n.category ?? null,
    description: n.description ?? null,
    metadata: n.metadata ?? null,
  }));

  const idByName = new Map<string, string>();
  for (const node of nodes) idByName.set(node.name, node.id);

  const relations: GraphRelation[] = KNOWLEDGE_RELATIONS.map((r, i) => {
    const sourceId = idByName.get(r.source);
    const targetId = idByName.get(r.target);
    if (!sourceId) throw new Error(`Fixture: unknown relation source "${r.source}"`);
    if (!targetId) throw new Error(`Fixture: unknown relation target "${r.target}"`);
    return {
      id: `r${i + 1}`,
      sourceId,
      targetId,
      relationType: r.relationType,
      weight: r.weight ?? 1,
    };
  });

  const nodesById = new Map<string, GraphNode>(nodes.map((n) => [n.id, n]));

  return { nodes, relations, nodesById };
}
