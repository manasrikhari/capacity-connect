import { z } from "zod";
import { NODE_TYPES, RELATION_TYPES } from "@/lib/taxonomy";

/**
 * Schemas for AI-proposed knowledge, kept separate from `validations/graph.ts`
 * on purpose: those are FormData-shaped (aliases arrive as a comma string,
 * relations reference cuids) while these are JSON-shaped (aliases are an
 * array, relations reference node NAMES because the model has never seen an
 * id). The vocabularies are shared so the two can never drift.
 */

/** Optional text that may arrive as null from a model or a FormData field. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v ?? "");

export const proposedNodeSchema = z.object({
  name: z.string().trim().min(2).max(160),
  type: z.enum(NODE_TYPES),
  category: optionalText(120),
  /**
   * Capped at 400, tighter than the 1000 the manual form allows.
   * `buildGroundedContext` injects every retrieved node's full description
   * into the MeghDoot system prompt with no per-node budget, and a 2-hop,
   * 12-path result can surface dozens of nodes. Hand-curated nodes arrive one
   * at a time; these arrive forty at a time, so they get the tighter bound.
   */
  description: z.string().trim().min(20).max(400),
  aliases: z.array(z.string().trim().min(1).max(80)).max(5).default([]),
  equation: optionalText(200),
});
export type ProposedNode = z.infer<typeof proposedNodeSchema>;

export const proposedRelationSchema = z.object({
  sourceName: z.string().trim().min(2).max(160),
  targetName: z.string().trim().min(2).max(160),
  relationType: z.enum(RELATION_TYPES),
  weight: z.coerce.number().min(0.1).max(5).default(1),
});
export type ProposedRelation = z.infer<typeof proposedRelationSchema>;

/** What one model call must return, per chunk. */
export const extractionResponseSchema = z.object({
  nodes: z.array(proposedNodeSchema).max(12),
  relations: z.array(proposedRelationSchema).max(24),
});

/**
 * The envelope, parsed leniently so one malformed item cannot discard a whole
 * chunk's worth of good ones. Callers validate each element individually and
 * count the casualties — extraction is inherently partial, unlike the MCQ
 * generator where a question set must be internally coherent.
 */
export const looseEnvelopeSchema = z.object({
  nodes: z.array(z.unknown()).default([]),
  relations: z.array(z.unknown()).default([]),
});

/** The edited proposal coming back from the review table, ready to save. */
export const saveProposalSchema = z.object({
  scope: z.enum(["course", "national"]),
  sourceLabel: z.string().trim().min(1).max(200),
  /** How the document arrived, so the library can show the right affordance. */
  kind: z.enum(["PDF", "LINK", "TEXT"]).default("TEXT"),
  /** Original address for a LINK, so the library can offer "open". */
  url: optionalText(2000),
  nodes: z.array(proposedNodeSchema).min(1).max(40),
  relations: z.array(proposedRelationSchema).max(80),
});
export type SaveProposalInput = z.infer<typeof saveProposalSchema>;
