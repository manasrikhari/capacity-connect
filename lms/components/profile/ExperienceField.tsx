import { FormField, Textarea } from "@/components/ui/Field";
import type { Experience } from "@/lib/validations/profile";

/**
 * A textarea listing work history one per line as "role | organisation | start |
 * end". A blank or "present" end marks an ongoing role. The server action parses
 * it back with parseExperience. Mirrors QualificationsField.
 */
export function ExperienceField({
  experience,
  error,
}: {
  experience: Experience[];
  error?: string;
}) {
  const value = experience
    .map((e) =>
      [e.role, e.organisation, e.startYear ?? "", e.current ? "present" : (e.endYear ?? "")].join(" | "),
    )
    .join("\n");

  return (
    <FormField label="Work experience" htmlFor="experience" error={error}>
      <Textarea
        id="experience"
        name="experience"
        defaultValue={value}
        rows={4}
        placeholder={"One per line: role | organisation | start year | end year\ne.g. Meteorologist-B | RMC Chennai | 2016 | present"}
      />
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
        One per line · role | organisation | start | end (or &ldquo;present&rdquo;)
      </p>
    </FormField>
  );
}
