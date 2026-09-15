/** URL-slug helpers for the announcements CMS. */

/** Turn a title into a lowercase, hyphenated, ASCII-ish slug. */
export function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "") // strip diacritics
      .replace(/[^a-z0-9]+/g, "-") // non-alphanumerics → hyphen
      .replace(/-{2,}/g, "-") // collapse repeats
      .replace(/^-+|-+$/g, "") // trim leading/trailing hyphens
      .slice(0, 80) || "announcement"
  );
}

/**
 * Given a base slug and the set of slugs already taken, return a unique slug by
 * suffixing -2, -3, … on collision. `taken` should exclude the row being
 * edited (so re-saving with the same title keeps the slug).
 */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}
