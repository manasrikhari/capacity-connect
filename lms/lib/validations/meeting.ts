import { z } from "zod";

export const meetingSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  date: z.string().min(1, "Date & time is required"),
  link: z.url("Enter a valid meeting URL"),
});

export type MeetingInput = z.infer<typeof meetingSchema>;
