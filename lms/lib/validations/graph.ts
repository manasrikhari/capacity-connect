import { z } from "zod";
import { NODE_TYPES, RELATION_TYPES } from "@/lib/taxonomy";

export const graphNodeSchema = z.object({
  name: z.string().min(1, "Name is required").max(160),
  type: z.enum(NODE_TYPES),
  category: z.string().max(120).optional().or(z.literal("")),
  description: z.string().max(1000).optional().or(z.literal("")),
  source: z.string().max(200).optional().or(z.literal("")),
  equation: z.string().max(200).optional().or(z.literal("")),
  aliases: z
    .string()
    .optional()
    .transform((v) =>
      (v ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
});
export type GraphNodeInput = z.infer<typeof graphNodeSchema>;

export const graphRelationSchema = z.object({
  sourceId: z.string().min(1, "Pick a source node"),
  targetId: z.string().min(1, "Pick a target node"),
  relationType: z.enum(RELATION_TYPES),
  weight: z.coerce.number().min(0.1).max(5).default(1),
});
export type GraphRelationInput = z.infer<typeof graphRelationSchema>;
