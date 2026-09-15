/**
 * Pure helpers for turning a document into proposed knowledge-graph nodes and
 * relations. No Prisma, no `server-only`, no network — so vitest runs these
 * with no DB and no env, the same contract as `lib/graphrag.ts`.
 *
 * The model call itself lives in `lib/knowledge-ingest.ts`; everything here is
 * deterministic and unit-tested.
 */

import type { ProposedNode, ProposedRelation } from "@/lib/validations/knowledge-extract";

/** Hard ceiling on how much of a document we read. ~15K tokens. */
export const MAX_DOC_CHARS = 60_000;
/** Per-chunk budget. ~3K tokens in, comfortably under any TPM ceiling. */
export const CHUNK_CHARS = 12_000;
/** Never send more than this many chunks for one document. */
export const MAX_CHUNKS = 5;
/** Post-merge caps, so one document can never flood the graph. */
export const MAX_NODES = 40;
export const MAX_RELATIONS = 80;

/**
 * Case- and whitespace-insensitive key for a node name.
 *
 * `KnowledgeNode.name` is `@unique`, but Postgres string uniqueness is
 * case-sensitive: "Doppler radar" and "Doppler Radar" would both insert and
 * split retrieval across two near-duplicate nodes. Every name comparison in
 * this feature goes through here first.
 */
export function normaliseName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Collapse the whitespace soup that PDF extraction produces. */
export function normaliseWhitespace(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((l) => l.trim())
    .join("\n")
    .trim();
}

/**
 * Split on paragraph boundaries, packing paragraphs up to `size`. A single
 * paragraph longer than `size` is hard-sliced rather than dropped.
 * Never returns an empty chunk.
 */
export function chunkText(text: string, size = CHUNK_CHARS, maxChunks = MAX_CHUNKS): string[] {
  const clean = normaliseWhitespace(text).slice(0, MAX_DOC_CHARS);
  if (!clean) return [];

  const paragraphs = clean.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  const chunks: string[] = [];
  let current = "";

  const push = () => {
    const t = current.trim();
    if (t) chunks.push(t);
    current = "";
  };

  for (const para of paragraphs) {
    if (para.length > size) {
      push();
      for (let i = 0; i < para.length; i += size) {
        const slice = para.slice(i, i + size).trim();
        if (slice) chunks.push(slice);
      }
      continue;
    }
    if (current && current.length + para.length + 2 > size) push();
    current = current ? `${current}\n\n${para}` : para;
  }
  push();

  return chunks.slice(0, maxChunks);
}

/** True when a PDF yielded so little text that it is probably page images. */
export function looksScanned(text: string, pageCount: number): boolean {
  return text.trim().length < Math.max(200, pageCount * 40);
}

export type ExtractionResult = { nodes: ProposedNode[]; relations: ProposedRelation[] };

/**
 * Fold per-chunk results into one proposal.
 *
 * Nodes are keyed on the normalised name. First occurrence wins for display
 * casing and type; the longest description wins, because a chunk that only
 * glanced at a concept produces a thinner one than the chunk that defined it.
 * Aliases union. Relations are keyed on both endpoints plus the type, and any
 * relation whose endpoints are not resolvable is dropped rather than inventing
 * a node for it.
 *
 * `knownNames` are node names that already exist in the database, so a relation
 * that links this document into the existing graph survives the filter.
 */
export function mergeProposals(
  results: ExtractionResult[],
  knownNames: string[] = [],
): ExtractionResult {
  const nodes = new Map<string, ProposedNode>();

  for (const r of results) {
    for (const n of r.nodes) {
      const key = normaliseName(n.name);
      if (!key) continue;
      const existing = nodes.get(key);
      if (!existing) {
        nodes.set(key, { ...n, aliases: [...new Set(n.aliases ?? [])] });
        continue;
      }
      nodes.set(key, {
        ...existing,
        category: existing.category || n.category,
        equation: existing.equation || n.equation,
        description:
          (n.description ?? "").length > (existing.description ?? "").length
            ? n.description
            : existing.description,
        aliases: [...new Set([...(existing.aliases ?? []), ...(n.aliases ?? [])])].slice(0, 5),
      });
    }
  }

  const resolvable = new Set<string>([
    ...nodes.keys(),
    ...knownNames.map(normaliseName).filter(Boolean),
  ]);

  const relations = new Map<string, ProposedRelation>();
  for (const r of results) {
    for (const rel of r.relations) {
      const src = normaliseName(rel.sourceName);
      const tgt = normaliseName(rel.targetName);
      if (!src || !tgt || src === tgt) continue;
      if (!resolvable.has(src) || !resolvable.has(tgt)) continue;
      const key = `${src}|${tgt}|${rel.relationType}`;
      const existing = relations.get(key);
      if (!existing || rel.weight > existing.weight) relations.set(key, rel);
    }
  }

  return {
    nodes: [...nodes.values()].slice(0, MAX_NODES),
    relations: [...relations.values()].slice(0, MAX_RELATIONS),
  };
}

/**
 * A deterministic, model-free draft built from markdown structure, used when
 * no LLM key is configured. Headings become CONCEPT nodes described by the
 * first sentence beneath them, and a sub-heading is PART_OF its parent.
 *
 * It is deliberately modest: the human edits everything before saving, so a
 * rough but honest skeleton beats an empty page.
 */
export function heuristicProposals(text: string): ExtractionResult {
  const lines = normaliseWhitespace(text).split("\n");
  const nodes: ProposedNode[] = [];
  const relations: ProposedRelation[] = [];
  const seen = new Set<string>();
  /** Most recent heading at each markdown level, for PART_OF parenting. */
  const parents: (string | null)[] = [null, null, null, null, null, null, null];

  for (let i = 0; i < lines.length; i++) {
    const m = /^(#{1,6})\s+(.+?)\s*#*$/.exec(lines[i]);
    if (!m) continue;

    const level = m[1].length;
    const name = m[2].replace(/[*_`]/g, "").trim().slice(0, 160);
    const key = normaliseName(name);
    if (!name || name.length < 2 || seen.has(key)) continue;

    // The first non-heading, non-empty line under the heading is its gloss.
    let description = "";
    for (let j = i + 1; j < lines.length && j < i + 8; j++) {
      const l = lines[j].trim();
      if (!l) continue;
      if (/^#{1,6}\s/.test(l)) break;
      description = l.replace(/[*_`>]/g, "").slice(0, 400);
      break;
    }
    if (description.length < 20) continue; // nothing useful to say about it

    seen.add(key);
    nodes.push({ name, type: "CONCEPT", category: "", description, aliases: [], equation: "" });

    const parent = parents.slice(0, level).reverse().find(Boolean);
    if (parent) {
      relations.push({
        sourceName: name,
        targetName: parent,
        relationType: "PART_OF",
        weight: 1,
      });
    }
    parents[level] = name;
    for (let deeper = level + 1; deeper < parents.length; deeper++) parents[deeper] = null;
  }

  return {
    nodes: nodes.slice(0, MAX_NODES),
    relations: relations.slice(0, MAX_RELATIONS),
  };
}
