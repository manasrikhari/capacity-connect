import { z } from "zod";

export const noticeSchema = z.object({
  text: z
    .string()
    .trim()
    .min(3, "A notice needs at least 3 characters")
    .max(500, "Keep notices under 500 characters"),
});

export type NoticeInput = z.infer<typeof noticeSchema>;
