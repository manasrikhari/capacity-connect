import { z } from "zod";

const rating = z.coerce.number().int().min(1).max(5);
const optionalRating = z.coerce.number().int().min(1).max(5).optional();

export const feedbackSchema = z.object({
  overallRating: rating,
  contentRating: optionalRating,
  trainerRating: optionalRating,
  infrastructureRating: optionalRating,
  comments: z.string().max(1000).optional().or(z.literal("")),
  suggestions: z.string().max(1000).optional().or(z.literal("")),
});
export type FeedbackInput = z.infer<typeof feedbackSchema>;
