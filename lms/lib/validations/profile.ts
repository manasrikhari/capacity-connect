import { z } from "zod";

export type Qualification = { degree: string; institution: string; year: number | null };

/** Parse a textarea "degree | institution | year" (one per line) → objects. */
export function parseQualifications(raw: string): Qualification[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [degree = "", institution = "", year = ""] = line.split("|").map((s) => s.trim());
      const y = Number.parseInt(year, 10);
      return { degree, institution, year: Number.isFinite(y) ? y : null };
    })
    .filter((q) => q.degree.length > 0);
}

export type Experience = {
  role: string;
  organisation: string;
  startYear: number | null;
  endYear: number | null;
  current: boolean;
};

/**
 * Parse a textarea "role | organisation | startYear | endYear" (one per line) →
 * objects. A blank or "present"/"current" endYear marks an ongoing role.
 */
export function parseExperience(raw: string): Experience[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [role = "", organisation = "", start = "", end = ""] = line.split("|").map((s) => s.trim());
      const startYear = Number.parseInt(start, 10);
      const endLower = end.toLowerCase();
      const current = endLower === "" || endLower === "present" || endLower === "current";
      const endYear = Number.parseInt(end, 10);
      return {
        role,
        organisation,
        startYear: Number.isFinite(startYear) ? startYear : null,
        endYear: current || !Number.isFinite(endYear) ? null : endYear,
        current,
      };
    })
    .filter((e) => e.role.length > 0);
}

/** Coerce a stored Json value into a typed work-history list (for prefill). */
export function coerceExperience(value: unknown): Experience[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((e): e is Record<string, unknown> => typeof e === "object" && e !== null)
    .map((e) => ({
      role: String(e.role ?? ""),
      organisation: String(e.organisation ?? ""),
      startYear: typeof e.startYear === "number" ? e.startYear : null,
      endYear: typeof e.endYear === "number" ? e.endYear : null,
      current: Boolean(e.current),
    }))
    .filter((e) => e.role.length > 0);
}

const urlOrEmpty = z.url("Enter a valid URL").optional().or(z.literal(""));

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  designation: z.string().max(120).optional().or(z.literal("")),
  // IMD cadre — the eligibility engine checks course prerequisites against it.
  cadre: z.string().max(60).optional().or(z.literal("")),
  department: z.string().max(120).optional().or(z.literal("")),
  organisation: z.string().max(120).optional().or(z.literal("")),
  postingLocation: z.string().max(160).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  bio: z.string().max(600, "Keep the bio under 600 characters").optional().or(z.literal("")),
  qualifications: z
    .string()
    .optional()
    .transform((v) => parseQualifications(v ?? "")),
  experience: z
    .string()
    .optional()
    .transform((v) => parseExperience(v ?? "")),
  yearsExperience: z.coerce.number().min(0).max(50).default(0),
  interests: z
    .string()
    .optional()
    .transform((v) =>
      (v ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  governmentIdType: z.string().max(60).optional().or(z.literal("")),
  governmentIdNum: z.string().max(60).optional().or(z.literal("")),
  resumeUrl: urlOrEmpty,
});

export type ProfileInput = z.infer<typeof profileSchema>;
