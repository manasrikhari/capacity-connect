/**
 * Pure helpers for the public course catalogue.
 *
 * Kept free of Prisma and React so the parsing, sorting and phase logic can be
 * unit-tested directly — the same split as `lib/eligibility.ts` and
 * `lib/competency.ts`.
 */

import { DEPARTMENTS, DOMAINS, LEVELS, WMO_TIERS } from "@/lib/taxonomy";

export const CATALOGUE_PAGE_SIZE = 12;

export const CATALOGUE_SORTS = ["starting", "newest", "name"] as const;
export type CatalogueSort = (typeof CATALOGUE_SORTS)[number];

export const SORT_LABEL: Record<CatalogueSort, string> = {
  starting: "Starting soonest",
  newest: "Recently added",
  name: "Name (A–Z)",
};

export type CatalogueParams = {
  q?: string;
  domain?: string;
  level?: string;
  department?: string;
  tier?: string;
  sort?: string;
  page?: string;
  past?: string;
};

export type CatalogueFilters = {
  q: string;
  domain: string | null;
  level: string | null;
  department: string | null;
  tier: string | null;
  sort: CatalogueSort;
  page: number;
  /** Include courses that have already finished. Off by default. */
  past: boolean;
};

function oneOf(value: string | undefined, allowed: readonly string[]): string | null {
  if (!value) return null;
  return allowed.includes(value) ? value : null;
}

/**
 * Normalise raw search params. Unknown facet values are dropped rather than
 * passed to the query, so a hand-edited URL cannot widen the result set or
 * smuggle a value into a `contains` clause.
 */
export function parseCatalogueParams(params: CatalogueParams): CatalogueFilters {
  const page = Number.parseInt(params.page ?? "1", 10);
  return {
    q: (params.q ?? "").trim().slice(0, 100),
    domain: oneOf(params.domain, DOMAINS),
    level: oneOf(params.level, LEVELS),
    department: oneOf(params.department, DEPARTMENTS),
    tier: oneOf(params.tier, WMO_TIERS),
    sort: (CATALOGUE_SORTS as readonly string[]).includes(params.sort ?? "")
      ? (params.sort as CatalogueSort)
      : "starting",
    page: Number.isFinite(page) && page > 0 ? page : 1,
    past: params.past === "1",
  };
}

/** True when any facet or search term is active — drives the "clear" affordance. */
export function hasActiveFilters(f: CatalogueFilters): boolean {
  return Boolean(f.q || f.domain || f.level || f.department || f.tier);
}

/** Serialise filters back to a query string, optionally overriding one key. */
export function catalogueQuery(
  f: CatalogueFilters,
  override: Partial<Record<keyof CatalogueFilters, string | null>> = {},
): string {
  const merged: Record<string, string | null> = {
    q: f.q || null,
    domain: f.domain,
    level: f.level,
    department: f.department,
    tier: f.tier,
    sort: f.sort === "starting" ? null : f.sort,
    page: f.page > 1 ? String(f.page) : null,
    past: f.past ? "1" : null,
    ...override,
  };
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v) sp.set(k, v);
  }
  return sp.toString();
}

export type CoursePhase = "upcoming" | "running" | "finished" | "open";

export type PhaseView = {
  phase: CoursePhase;
  label: string;
  /** Badge colour from the design system. */
  color: "green" | "amber" | "slate" | "violet";
};

/**
 * Where a course sits in its own lifecycle, from its dates alone.
 *
 * A course with no dates at all is "open" rather than "upcoming": several
 * seeded courses carry no schedule, and calling those "starts soon" would be a
 * lie the catalogue repeats on every card.
 */
export function coursePhase(
  startDate: Date | null | undefined,
  endDate: Date | null | undefined,
  now: Date = new Date(),
): PhaseView {
  const t = now.getTime();
  const start = startDate ? startDate.getTime() : null;
  const end = endDate ? endDate.getTime() : null;

  if (end !== null && end < t) return { phase: "finished", label: "Completed", color: "slate" };
  if (start !== null && start > t) return { phase: "upcoming", label: "Upcoming", color: "violet" };
  if (start !== null && start <= t) return { phase: "running", label: "In progress", color: "green" };
  return { phase: "open", label: "Open", color: "amber" };
}

/** Days until a course starts; null when it has no start date or has begun. */
export function daysUntilStart(
  startDate: Date | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!startDate) return null;
  const ms = startDate.getTime() - now.getTime();
  if (ms <= 0) return null;
  return Math.ceil(ms / 86_400_000);
}

/** Course duration in whole weeks, for the card's "6 weeks" line. */
export function durationWeeks(
  startDate: Date | null | undefined,
  endDate: Date | null | undefined,
): number | null {
  if (!startDate || !endDate) return null;
  const ms = endDate.getTime() - startDate.getTime();
  if (ms <= 0) return null;
  return Math.max(1, Math.round(ms / (7 * 86_400_000)));
}
