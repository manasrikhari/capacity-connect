// GraphRAG core — a PURE, in-memory knowledge-graph retrieval module.
//
// This file intentionally imports NOTHING from the DB, Prisma, Next.js or any
// server code so it runs in vitest with no database or environment. Callers pass
// already-materialised graph data (nodes + relations) in; everything here is a
// pure function over those inputs.
//
// Pipeline: extractQueryTerms → findSeedNodes → traverse → buildGroundedContext.
// queryGraph wires the whole pipeline together. renderFallbackAnswer produces a
// no-LLM markdown answer, and encode/splitCitations move Citation[] through a
// streamed chat message body.

export type NodeMetadata = {
  aliases?: string[];
  source?: string;
  equation?: string;
  units?: string;
};

export type GraphNode = {
  id: string;
  name: string;
  type: string;
  category: string | null;
  description: string | null;
  metadata: NodeMetadata | null;
};

export type GraphRelation = {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: string;
  weight: number;
};

export type SeedNode = {
  node: GraphNode;
  score: number;
  matchedTerms: string[];
};

export type GraphPath = {
  nodes: GraphNode[];
  relations: GraphRelation[];
  directions: ("fwd" | "rev")[];
  score: number;
};

export type Citation = {
  nodeId: string;
  nodeName: string;
  type: string;
  category: string | null;
  source?: string;
};

// Common English function words plus a few question words. Stripped from queries
// before term extraction. Protected domain acronyms below are never stripped.
const STOPWORDS = new Set([
  "the", "a", "an", "of", "to", "is", "are", "and", "before", "which", "what",
  "for", "in", "on", "with", "by", "at", "as", "or", "be", "how", "does", "do",
  "from", "that", "this", "it", "its", "into", "was", "were", "will", "would",
  "can", "could", "should", "we", "you", "i", "they", "he", "she", "them",
  "about", "between", "when", "where", "who", "why", "than", "then", "there",
  "these", "those", "such", "not", "no", "but", "if", "so", "up", "out", "over",
]);

// Domain acronyms kept verbatim (never stemmed, never de-hyphenated variants).
const PROTECTED = new Set([
  "wrf", "nwp", "insat", "dwr", "gfs", "imd", "wmo", "damu", "rmc",
]);

// Very light singular-ising stemmer: strips a single trailing plural "s" while
// leaving protected acronyms and short/`ss` words alone.
function lightStem(token: string): string {
  if (PROTECTED.has(token)) return token;
  if (token.length > 3 && token.endsWith("s") && !token.endsWith("ss")) {
    return token.slice(0, -1);
  }
  return token;
}

/**
 * Lowercase a query and split it into ranked search terms.
 * Order: adjacent-word bigrams first, then unigrams. Stopwords are dropped.
 * Hyphenated tokens (e.g. "de-aliasing") are kept AND a de-hyphenated variant
 * ("dealiasing") is added. Protected acronyms (wrf, insat, …) are kept verbatim.
 * Other unigrams are lightly de-pluralised. Result is de-duplicated, order kept.
 */
export function extractQueryTerms(query: string): string[] {
  const lowered = (query ?? "").toLowerCase();
  // Tokens are runs of alphanumerics, allowing internal hyphens ("z-r", "de-aliasing").
  const rawTokens = lowered.match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? [];
  const content = rawTokens.filter((t) => !STOPWORDS.has(t));

  const terms: string[] = [];
  const seen = new Set<string>();
  const push = (t: string) => {
    if (t && !seen.has(t)) {
      seen.add(t);
      terms.push(t);
    }
  };

  // Bigrams from adjacent surviving (non-stopword) tokens — verbatim, no stemming.
  for (let i = 0; i < content.length - 1; i++) {
    push(`${content[i]} ${content[i + 1]}`);
  }

  // Unigrams.
  for (const token of content) {
    if (PROTECTED.has(token)) {
      push(token);
      continue;
    }
    if (token.includes("-")) {
      push(token); // keep hyphenated form
      push(token.replace(/-/g, "")); // de-hyphenated variant
      continue;
    }
    push(lightStem(token));
  }

  return terms;
}

const EXACT_NAME = 10;
const ALIAS_EXACT = 8;
const NAME_SUBSTR = 6;
const ALIAS_SUBSTR = 4;
const DESC_SUBSTR = 1.5;

// Best single-term contribution against one node (pre-bigram-boost).
function baseContribution(term: string, node: GraphNode): number {
  const name = node.name.toLowerCase();
  const aliases = (node.metadata?.aliases ?? []).map((a) => a.toLowerCase());
  const desc = (node.description ?? "").toLowerCase();

  let best = 0;
  if (name === term) best = Math.max(best, EXACT_NAME);
  if (aliases.includes(term)) best = Math.max(best, ALIAS_EXACT);
  if (name.includes(term)) best = Math.max(best, NAME_SUBSTR);
  if (aliases.some((a) => a.includes(term))) best = Math.max(best, ALIAS_SUBSTR);
  if (desc.includes(term)) best = Math.max(best, DESC_SUBSTR);
  return best;
}

/**
 * Score every node against the query terms and return the top K seeds.
 * A term's contribution is its best match type (exact name 10, alias exact 8,
 * name substring 6, alias substring 4, description substring 1.5), multiplied by
 * 1.5 when the term is a bigram (contains a space). Nodes are ranked primarily by
 * their single strongest term, then by the sum over distinct matched terms; ties
 * break on node name ascending. Only nodes with score > 0 are returned.
 */
export function findSeedNodes(
  terms: string[],
  nodes: GraphNode[],
  topK = 4,
): SeedNode[] {
  type Scored = {
    node: GraphNode;
    total: number;
    maxSingle: number;
    matchedTerms: string[];
  };

  const scored: Scored[] = [];
  for (const node of nodes) {
    let total = 0;
    let maxSingle = 0;
    const matchedTerms: string[] = [];
    for (const term of terms) {
      const base = baseContribution(term, node);
      if (base <= 0) continue;
      const contribution = term.includes(" ") ? base * 1.5 : base;
      total += contribution;
      if (contribution > maxSingle) maxSingle = contribution;
      matchedTerms.push(term);
    }
    if (total > 0) scored.push({ node, total, maxSingle, matchedTerms });
  }

  scored.sort((a, b) => {
    if (b.maxSingle !== a.maxSingle) return b.maxSingle - a.maxSingle;
    if (b.total !== a.total) return b.total - a.total;
    return a.node.name.localeCompare(b.node.name);
  });

  return scored.slice(0, topK).map((s) => ({
    node: s.node,
    score: s.total,
    matchedTerms: s.matchedTerms,
  }));
}

type Edge = { relation: GraphRelation; otherId: string; dir: "fwd" | "rev" };

function buildAdjacency(relations: GraphRelation[]): Map<string, Edge[]> {
  const adj = new Map<string, Edge[]>();
  const add = (from: string, edge: Edge) => {
    const list = adj.get(from);
    if (list) list.push(edge);
    else adj.set(from, [edge]);
  };
  for (const r of relations) {
    add(r.sourceId, { relation: r, otherId: r.targetId, dir: "fwd" });
    add(r.targetId, { relation: r, otherId: r.sourceId, dir: "rev" });
  }
  return adj;
}

/**
 * Breadth-first traversal from each seed, following relations in BOTH directions
 * (fwd = source→target, rev = target→source). Within a single seed's search each
 * node is visited at most once (no cycles, no revisits). Only maximal (leaf)
 * paths are emitted — a path that reaches maxHops or cannot be extended. Each hop
 * multiplies the path score by (relation.weight * hopDecay); the seed's own base
 * score is seed.score / maxSeedScore. Isolated seeds yield a 0-hop stub path.
 * Paths are de-duplicated by their sorted relation-id set, sorted by score
 * descending, and capped at maxPaths.
 */
export function traverse(
  seeds: SeedNode[],
  relations: GraphRelation[],
  nodesById: Map<string, GraphNode>,
  opts?: { maxHops?: number; maxPaths?: number; hopDecay?: number },
): GraphPath[] {
  const maxHops = opts?.maxHops ?? 2;
  const maxPaths = opts?.maxPaths ?? 12;
  const hopDecay = opts?.hopDecay ?? 0.85;

  const adj = buildAdjacency(relations);
  const maxSeedScore = seeds.reduce((m, s) => Math.max(m, s.score), 0) || 1;

  type Partial = {
    nodes: GraphNode[];
    relations: GraphRelation[];
    directions: ("fwd" | "rev")[];
    score: number;
    hops: number;
  };

  const collected: GraphPath[] = [];
  const coveredNodeIds = new Set<string>();

  for (const seed of seeds) {
    const seedNode = nodesById.get(seed.node.id) ?? seed.node;
    const base = seed.score / maxSeedScore;
    const visited = new Set<string>([seedNode.id]);

    const start: Partial = {
      nodes: [seedNode],
      relations: [],
      directions: [],
      score: base,
      hops: 0,
    };
    const queue: Partial[] = [start];

    while (queue.length > 0) {
      const cur = queue.shift()!;
      const lastId = cur.nodes[cur.nodes.length - 1].id;
      let extended = false;

      if (cur.hops < maxHops) {
        for (const edge of adj.get(lastId) ?? []) {
          if (visited.has(edge.otherId)) continue;
          const otherNode = nodesById.get(edge.otherId);
          if (!otherNode) continue;
          visited.add(edge.otherId);
          extended = true;
          queue.push({
            nodes: [...cur.nodes, otherNode],
            relations: [...cur.relations, edge.relation],
            directions: [...cur.directions, edge.dir],
            score: cur.score * (edge.relation.weight * hopDecay),
            hops: cur.hops + 1,
          });
        }
      }

      if (!extended) {
        const path: GraphPath = {
          nodes: cur.nodes,
          relations: cur.relations,
          directions: cur.directions,
          score: cur.score,
        };
        collected.push(path);
        for (const n of path.nodes) coveredNodeIds.add(n.id);
      }
    }
  }

  // Defensive: emit a 0-hop stub for any seed that never appeared in a path.
  for (const seed of seeds) {
    if (!coveredNodeIds.has(seed.node.id)) {
      const seedNode = nodesById.get(seed.node.id) ?? seed.node;
      collected.push({
        nodes: [seedNode],
        relations: [],
        directions: [],
        score: seed.score / maxSeedScore,
      });
      coveredNodeIds.add(seed.node.id);
    }
  }

  // De-duplicate by the sorted set of relation ids.
  const seenKeys = new Set<string>();
  const unique: GraphPath[] = [];
  for (const p of collected) {
    const key = p.relations.map((r) => r.id).sort().join("|");
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    unique.push(p);
  }

  unique.sort((a, b) => b.score - a.score);
  return unique.slice(0, maxPaths);
}

/**
 * Render a path as a human-readable chain, e.g.
 * "[A] → OBSERVED_BY → [B] ← MEASURES ← [C]". A single-node path renders "[A]".
 */
export function renderPath(p: GraphPath): string {
  let out = `[${p.nodes[0]?.name ?? ""}]`;
  for (let i = 0; i < p.relations.length; i++) {
    const rel = p.relations[i];
    const dir = p.directions[i];
    const next = p.nodes[i + 1];
    if (dir === "rev") {
      out += ` ← ${rel.relationType} ← [${next?.name ?? ""}]`;
    } else {
      out += ` → ${rel.relationType} → [${next?.name ?? ""}]`;
    }
  }
  return out;
}

/**
 * Collapse a set of paths into a grounded-context prompt block plus citations.
 * Citations are one per DISTINCT node across all paths (in first-appearance
 * order). contextText is a numbered list of rendered paths followed by a
 * "Concepts:" section with one bullet per distinct node.
 */
export function buildGroundedContext(
  paths: GraphPath[],
): { contextText: string; citations: Citation[] } {
  const citations: Citation[] = [];
  const nodeById = new Map<string, GraphNode>();
  const order: string[] = [];

  for (const p of paths) {
    for (const n of p.nodes) {
      if (nodeById.has(n.id)) continue;
      nodeById.set(n.id, n);
      order.push(n.id);
      citations.push({
        nodeId: n.id,
        nodeName: n.name,
        type: n.type,
        category: n.category,
        source: n.metadata?.source,
      });
    }
  }

  const pathLines = paths.map((p, i) => `${i + 1}. ${renderPath(p)}`);

  const conceptLines = order.map((id) => {
    const n = nodeById.get(id)!;
    const typeCat = n.category ? `${n.type} · ${n.category}` : n.type;
    let line = `- ${n.name} (${typeCat}): ${n.description ?? ""}`;
    if (n.metadata?.equation) line += ` Formula: $${n.metadata.equation}$`;
    if (n.metadata?.source) line += ` [Source: ${n.name} — ${n.metadata.source}]`;
    return line;
  });

  const contextText = [
    pathLines.join("\n"),
    "",
    "Concepts:",
    conceptLines.join("\n"),
  ].join("\n");

  return { contextText, citations };
}

/**
 * Full pipeline: query string → terms, seeds, paths, grounded context + citations.
 */
export function queryGraph(
  query: string,
  nodes: GraphNode[],
  relations: GraphRelation[],
  opts?: { maxHops?: number; maxPaths?: number },
): {
  terms: string[];
  seeds: SeedNode[];
  paths: GraphPath[];
  contextText: string;
  citations: Citation[];
} {
  const terms = extractQueryTerms(query);
  const seeds = findSeedNodes(terms, nodes);
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const paths = traverse(seeds, relations, nodesById, {
    maxHops: opts?.maxHops,
    maxPaths: opts?.maxPaths,
  });
  const { contextText, citations } = buildGroundedContext(paths);
  return { terms, seeds, paths, contextText, citations };
}

/**
 * Render a self-contained markdown answer when no language model is configured.
 */
export function renderFallbackAnswer(
  query: string,
  paths: GraphPath[],
  citations: Citation[],
): string {
  const lines: string[] = [];
  lines.push("> Knowledge-graph mode — no language model configured");
  lines.push("");

  lines.push("### How the graph connects");
  const topPaths = paths.slice(0, 5);
  if (topPaths.length === 0) {
    lines.push("- No connected concepts were found for this query.");
  } else {
    for (const p of topPaths) {
      let rendered = `[${p.nodes[0]?.name ?? ""}]`;
      for (let i = 0; i < p.relations.length; i++) {
        const rel = p.relations[i];
        const dir = p.directions[i];
        const next = p.nodes[i + 1];
        const arrow = dir === "rev" ? "←" : "→";
        rendered += ` ${arrow} *${rel.relationType}* ${arrow} **${next?.name ?? ""}**`;
      }
      // Bold the first node too.
      rendered = rendered.replace(
        `[${p.nodes[0]?.name ?? ""}]`,
        `**${p.nodes[0]?.name ?? ""}**`,
      );
      lines.push(`- ${rendered}`);
    }
  }
  lines.push("");

  // Distinct nodes across paths for the Concepts section.
  const seen = new Set<string>();
  const nodes: GraphNode[] = [];
  for (const p of paths) {
    for (const n of p.nodes) {
      if (seen.has(n.id)) continue;
      seen.add(n.id);
      nodes.push(n);
    }
  }

  lines.push("### Concepts");
  if (nodes.length === 0) {
    lines.push("- (none)");
  } else {
    for (const n of nodes) {
      const typeCat = n.category ? `${n.type} · ${n.category}` : n.type;
      lines.push(`- **${n.name}** (${typeCat}): ${n.description ?? ""}`);
      if (n.metadata?.equation) lines.push(`$$${n.metadata.equation}$$`);
    }
  }
  lines.push("");

  lines.push("### Sources");
  const withSource = citations.filter((c) => c.source);
  if (withSource.length === 0) {
    lines.push("- No external sources cited.");
  } else {
    for (const c of withSource) {
      lines.push(`- ${c.nodeName} — ${c.source}`);
    }
  }

  return lines.join("\n");
}

export const CITATIONS_OPEN = "<citations>";
export const CITATIONS_CLOSE = "</citations>";

/** Encode citations as a trailing block appended to a chat message body. */
export function encodeCitations(c: Citation[]): string {
  return "\n" + CITATIONS_OPEN + JSON.stringify(c) + CITATIONS_CLOSE;
}

/**
 * Split a message body into its visible text and any trailing citations block.
 * Tolerates a truncated or absent tail: if the citations JSON is missing or
 * unparseable, citations is [] and text is the content before the marker
 * (or the whole trimmed content when there is no marker at all).
 */
export function splitCitations(
  content: string,
): { text: string; citations: Citation[] } {
  const idx = content.indexOf(CITATIONS_OPEN);
  if (idx === -1) return { text: content.trimEnd(), citations: [] };

  const text = content.slice(0, idx).trimEnd();
  const rest = content.slice(idx + CITATIONS_OPEN.length);
  const end = rest.indexOf(CITATIONS_CLOSE);
  const jsonStr = end === -1 ? rest : rest.slice(0, end);

  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) return { text, citations: parsed as Citation[] };
  } catch {
    // fall through to empty citations
  }
  return { text, citations: [] };
}
