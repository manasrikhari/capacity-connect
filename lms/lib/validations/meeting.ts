import { z } from "zod";

export const meetingSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  date: z.string().min(1, "Date & time is required"),
  durationMins: z.coerce
    .number()
    .int("Duration must be a whole number of minutes")
    .min(15, "Duration must be at least 15 minutes")
    .max(480, "Duration cannot exceed 8 hours")
    .default(60),
  // Optional: in-app live classes need no external link.
  link: z.url("Enter a valid meeting URL").optional().or(z.literal("")),
});

export type MeetingInput = z.infer<typeof meetingSchema>;
