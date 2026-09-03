import { z } from "zod";
import { DOMAINS, LEVELS, DEPARTMENTS, WMO_TIERS } from "@/lib/taxonomy";

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? new Date(v) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), {
    message: "Enter a valid date",
  });

export const batchSchema = z.object({
  name: z.string().min(1, "Course name is required").max(200),
  subject: z.enum(DOMAINS), // operational domain
  grade: z.enum(LEVELS).optional().or(z.literal("")), // course level
  description: z.string().max(1000).optional().or(z.literal("")),
  department: z.enum(DEPARTMENTS).optional().or(z.literal("")),
  wmoTier: z.enum(WMO_TIERS).optional().or(z.literal("")),
  startDate: optionalDate,
  endDate: optionalDate,
});
export type BatchInput = z.infer<typeof batchSchema>;
