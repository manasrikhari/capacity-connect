import { z } from "zod";

export const LIBRARY_ITEM_TYPES = [
  "RECORDED_LECTURE",
  "PRESENTATION",
  "DOCUMENT",
  "MANUAL",
] as const;

export const libraryItemSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional().or(z.literal("")),
  type: z.enum(LIBRARY_ITEM_TYPES),
  subject: z.string().max(120).optional().or(z.literal("")),
  skillId: z.string().optional().or(z.literal("")),
  // Either an uploaded file (fileUrl set by /api/upload) or an external URL.
  fileUrl: z.string().optional().or(z.literal("")),
  externalUrl: z.url("Enter a valid URL").optional().or(z.literal("")),
  mimeType: z.string().optional().or(z.literal("")),
  fileSizeBytes: z.coerce.number().int().min(0).optional(),
  durationMins: z.coerce.number().int().min(0).max(100000).optional(),
});
export type LibraryItemInput = z.infer<typeof libraryItemSchema>;
