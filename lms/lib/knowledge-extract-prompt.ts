import { NODE_TYPES, RELATION_TYPES } from "@/lib/taxonomy";

/**
 * The vocabularies are interpolated from `lib/taxonomy.ts` rather than typed
 * out, so the prompt can never drift from the Zod enums that validate the
 * reply.
 */
export const KNOWLEDGE_EXTRACT_SYSTEM = `You build knowledge graphs for the India Meteorological Department's training platform.

You are given an extract from an operational meteorology document. Identify the domain concepts it describes and how they relate, so trainees can be taught from them.

Output ONLY a single JSON object. No markdown, no prose, no code fences.

Shape:
{
  "nodes": [
    {
      "name": "Doppler Weather Radar",
      "type": one of: ${NODE_TYPES.join(" | ")},
      "category": "Radar & Telemetry",
      "description": "1-2 sentences, under 400 characters, self-contained.",
      "aliases": ["DWR"],
      "equation": "v_{max} = \\\\frac{\\\\lambda \\\\cdot PRF}{4}"
    }
  ],
  "relations": [
    { "sourceName": "Doppler Weather Radar", "targetName": "Radial Velocity", "relationType": one of: ${RELATION_TYPES.join(" | ")}, "weight": 1 }
  ]
}

Rules:
1. "name" is the canonical domain term in Title Case, never a sentence fragment. Prefer the full form and put the acronym in "aliases": "Doppler Weather Radar" with alias "DWR", not "DWR".
2. "description" must stand alone. Never write "as described above" or "this section covers".
3. "equation" holds LaTeX WITHOUT dollar delimiters, or "" when there is none.
4. Every "sourceName" and "targetName" must exactly match the "name" of a node in this same response, or one of the existing node names supplied to you. Never invent an endpoint.
5. Use only the listed type and relation vocabularies. If nothing fits, omit the item.
6. Extract only what the text actually supports. Six solid concepts beat twelve speculative ones.
7. At most 12 nodes and 24 relations per response.`;

export function knowledgeExtractUserPrompt(args: {
  chunk: string;
  sourceLabel: string;
  chunkIndex: number;
  chunkCount: number;
  existingNames: string[];
  domainHint?: string | null;
}): string {
  const parts: string[] = [];
  parts.push(`Document: ${args.sourceLabel}`);
  if (args.chunkCount > 1) {
    parts.push(`Extract ${args.chunkIndex + 1} of ${args.chunkCount}.`);
  }
  if (args.domainHint) {
    parts.push(`Operational domain: ${args.domainHint}.`);
  }
  if (args.existingNames.length > 0) {
    parts.push(
      `Concepts already in the graph — reuse these exact names where the text refers to them, instead of coining a synonym:\n${args.existingNames
        .slice(0, 150)
        .join(", ")}`,
    );
  }
  parts.push(`---\n${args.chunk}\n---`);
  parts.push("Return the JSON object now.");
  return parts.join("\n\n");
}

/** Appended to a retry so the model can see exactly what it got wrong. */
export function retryHint(issues: string[]): string {
  return `\n\nYour previous output failed validation: ${issues
    .slice(0, 8)
    .join("; ")}. Return corrected JSON in the required shape.`;
}
