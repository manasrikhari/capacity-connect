/**
 * The State Emblem of India, opt-in by configuration.
 *
 * Nothing ships with this repo: the emblem is restricted by the State Emblem
 * of India (Prohibition of Improper Use) Act, 2005, so displaying it is the
 * deploying team's decision rather than a default.
 *
 * To turn it on: save the official artwork at `public/gov/emblem.svg` and set
 *   NEXT_PUBLIC_GOV_EMBLEM_SRC="/gov/emblem.svg"
 * It then appears in the public masthead and as the sidebar brand mark. Unset,
 * both fall back cleanly and there is never a broken image.
 *
 * Deliberately NOT a filesystem check: `Sidebar` is a client component, so
 * anything it imports must be safe in the browser bundle. A NEXT_PUBLIC_ env
 * var is inlined at build time and works in both server and client components.
 */
export const GOV_EMBLEM_SRC: string | null =
  process.env.NEXT_PUBLIC_GOV_EMBLEM_SRC?.trim() || null;
