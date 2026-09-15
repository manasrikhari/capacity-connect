import { FormField, Textarea } from "@/components/ui/Field";
import type { Qualification } from "@/lib/validations/profile";

/**
 * A textarea listing qualifications one per line as "degree | institution |
 * year". Prefilled by joining the stored objects; the server action parses it
 * back with parseQualifications.
 */
export function QualificationsField({
  qualifications,
  error,
}: {
  qualifications: Qualification[];
  error?: string;
}) {
  const value = qualifications
    .map((q) => [q.degree, q.institution, q.year ?? ""].join(" | "))
    .join("\n");

  return (
    <FormField label="Qualifications" htmlFor="qualifications" error={error}>
      <Textarea
        id="qualifications"
        name="qualifications"
        defaultValue={value}
        rows={4}
        placeholder={"One per line: degree | institution | year\ne.g. M.Sc Meteorology | IITM Pune | 2018"}
      />
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
        One per line · degree | institution | year
      </p>
    </FormField>
  );
}
