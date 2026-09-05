import "server-only";
import { GroqError, GroqRateLimitError, groqComplete, hasGroqKey } from "@/lib/groq";
import {
  chunkText,
  heuristicProposals,
  mergeProposals,
  type ExtractionResult,
} from "@/lib/knowledge-extract";
import {
  KNOWLEDGE_EXTRACT_SYSTEM,
  knowledgeExtractUserPrompt,
  retryHint,
} from "@/lib/knowledge-extract-prompt";
import { stripJsonFences } from "@/lib/llm";
import {
  looseEnvelopeSchema,
  proposedNodeSchema,
  proposedRelationSchema,
  type ProposedNode,
  type ProposedRelation,
} from "@/lib/validations/knowledge-extract";

export type ProposalSource = "llm" | "heuristic";

export type IngestOutcome = ExtractionResult & {
  source: ProposalSource;
  warnings: string[];
};

/**
 * Parse one model reply. Items are validated individually so a single
 * hallucinated node type cannot discard eleven good ones — extraction is
 * inherently partial, unlike an MCQ set which must be internally coherent.
 */
function parseChunkReply(raw: string): { result: ExtractionResult; issues: string[] } {
  const envelope = looseEnvelopeSchema.safeParse(JSON.parse(stripJsonFences(raw)));
  if (!envelope.success) {
    return { result: { nodes: [], relations: [] }, issues: ["response was not the expected object"] };
  }

  const nodes: ProposedNode[] = [];
  const relations: ProposedRelation[] = [];
  const issues: string[] = [];

  for (const candidate of envelope.data.nodes) {
    const parsed = proposedNodeSchema.safeParse(candidate);
    if (parsed.success) nodes.push(parsed.data);
    else issues.push(parsed.error.issues[0]?.message ?? "invalid node");
  }
  for (const candidate of envelope.data.relations) {
    const parsed = proposedRelationSchema.safeParse(candidate);
    if (parsed.success) relations.push(parsed.data);
    else issues.push(parsed.error.issues[0]?.message ?? "invalid relation");
  }

  return { result: { nodes, relations }, issues };
}

/**
 * Turn document text into proposed nodes and relations.
 *
 * Chunks are processed sequentially, never in parallel: concurrency is what
 * trips a tokens-per-minute limit. Any chunk that fails outright is skipped
 * with a warning rather than failing the whole document, and if every chunk
 * fails we fall back to the deterministic markdown heuristic so the user still
 * gets an editable draft.
 */
export async function proposeKnowledge(args: {
  text: string;
  sourceLabel: string;
  existingNames: string[];
  domainHint?: string | null;
}): Promise<IngestOutcome> {
  const chunks = chunkText(args.text);
  const warnings: string[] = [];

  if (chunks.length === 0) {
    return { nodes: [], relations: [], source: "heuristic", warnings: ["The document was empty."] };
  }

  if (!hasGroqKey()) {
    const draft = heuristicProposals(args.text);
    return {
      ...mergeProposals([draft], args.existingNames),
      source: "heuristic",
      warnings: ["No AI key is configured, so this is a structural draft from the document's headings."],
    };
  }

  const results: ExtractionResult[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const basePrompt = knowledgeExtractUserPrompt({
      chunk: chunks[i]!,
      sourceLabel: args.sourceLabel,
      chunkIndex: i,
      chunkCount: chunks.length,
      existingNames: args.existingNames,
      domainHint: args.domainHint,
    });

    let attemptPrompt = basePrompt;
    let captured: ExtractionResult | null = null;

    for (let attempt = 0; attempt < 2 && !captured; attempt++) {
      try {
        const raw = await groqComplete({
          system: KNOWLEDGE_EXTRACT_SYSTEM,
          user: attemptPrompt,
        });
        const { result, issues } = parseChunkReply(raw);
        if (result.nodes.length > 0) {
          captured = result;
          if (issues.length > 0) {
            warnings.push(`Extract ${i + 1}: skipped ${issues.length} malformed item(s).`);
          }
        } else if (attempt === 0) {
          attemptPrompt = basePrompt + retryHint(issues);
        }
      } catch (err) {
        if (err instanceof GroqRateLimitError && attempt === 0) {
          await new Promise((r) => setTimeout(r, err.retryAfterMs));
          continue; // same prompt, once more
        }
        const detail =
          err instanceof GroqError ? `AI error ${err.status}` : "the AI request failed";
        warnings.push(`Extract ${i + 1} of ${chunks.length}: ${detail}.`);
        break;
      }
    }

    if (captured) results.push(captured);
    else if (!warnings.some((w) => w.startsWith(`Extract ${i + 1}`))) {
      warnings.push(`Extract ${i + 1} of ${chunks.length}: no usable concepts returned.`);
    }
  }

  if (results.length === 0) {
    const draft = heuristicProposals(args.text);
    return {
      ...mergeProposals([draft], args.existingNames),
      source: "heuristic",
      warnings: [...warnings, "The AI returned nothing usable, so this is a structural draft."],
    };
  }

  return { ...mergeProposals(results, args.existingNames), source: "llm", warnings };
}
