import { z } from "zod";

export const noteSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  subject: z.string().min(1, "Subject is required").max(100),
  content: z.string().min(1, "Content is required"),
  fileUrl: z.url("Enter a valid file URL").optional().or(z.literal("")),
});

export type NoteInput = z.infer<typeof noteSchema>;
