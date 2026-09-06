import { z } from "zod";

export type NominationRow = {
  name: string | null;
  email: string;
  cadre: string | null;
  designation: string | null;
};

export type NominationParse = {
  rows: NominationRow[];
  /** Lines that carried no recognisable email address, echoed back verbatim. */
  rejected: string[];
};

const EMAIL_RE = /^[^\s@,;|]+@[^\s@,;|]+\.[^\s@,;|]+$/;

/** Longest list a SPOC can paste in one go — a whole office, not a whole cadre. */
export const MAX_NOMINEES = 200;

/**
 * Parse a pasted staff list.
 *
 * A SPOC will paste whatever their office keeps — a column of emails, a CSV
 * export, or "Name, email, cadre". Rather than demanding one format, find the
 * email in each line and treat the remaining fields positionally. Anything
 * unparseable is returned in `rejected` so the SPOC can see exactly which line
 * was dropped instead of silently losing someone.
 */
export function parseNominationList(raw: string): NominationParse {
  const rows: NominationRow[] = [];
  const rejected: string[] = [];
  const seen = new Set<string>();

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const parts = trimmed
      .split(/[|,;\t]/)
      .map((p) => p.trim())
      .filter(Boolean);

    const emailIndex = parts.findIndex((p) => EMAIL_RE.test(p));
    if (emailIndex === -1) {
      rejected.push(trimmed);
      continue;
    }

    const email = parts[emailIndex].toLowerCase();
    if (seen.has(email)) continue;
    seen.add(email);

    const rest = parts.filter((_, i) => i !== emailIndex);
    rows.push({
      name: rest[0] ?? null,
      email,
      cadre: rest[1] ?? null,
      designation: rest[2] ?? null,
    });

    if (rows.length >= MAX_NOMINEES) break;
  }

  return { rows, rejected };
}

/**
 * `departmentId` is deliberately absent: it is authorised against the SPOC's
 * own departments in the action, and a hidden-but-required field is exactly how
 * a form fails silently. Everything here maps to a control the user can see.
 */
export const nominationSchema = z.object({
  batchId: z.string().min(1, "Choose a course"),
  list: z.string().min(1, "Paste at least one email address"),
});
