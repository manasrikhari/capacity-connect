import { z } from "zod";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/taxonomy";

export const announcementSchema = z.object({
  title: z.string().min(1, "Title is required").max(160),
  summary: z.string().max(300).optional().or(z.literal("")),
  content: z.string().min(20, "Content must be at least 20 characters"),
  category: z.enum(ANNOUNCEMENT_CATEGORIES),
  bannerUrl: z.url("Enter a valid URL").optional().or(z.literal("")),
  isFeatured: z.coerce.boolean().default(false),
  isPublished: z.coerce.boolean().default(false),
});
export type AnnouncementInput = z.infer<typeof announcementSchema>;
