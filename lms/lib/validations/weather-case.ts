import { z } from "zod";
import { IMD_COLOURS } from "@/lib/forecast-verification";

/** A trainer-authored forecasting drill case. */
export const weatherCaseSchema = z.object({
  title: z.string().trim().min(3, "Give the case a short title").max(160),
  description: z.string().trim().min(10, "Describe the weather situation the trainee must judge"),
  hazard: z.string().trim().max(60).optional().or(z.literal("")),
  region: z.string().trim().max(80).optional().or(z.literal("")),
  imageUrl: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  correctColour: z.enum(IMD_COLOURS),
});

export type WeatherCaseInput = z.infer<typeof weatherCaseSchema>;
