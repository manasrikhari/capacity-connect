import { X } from "lucide-react";
import Link from "next/link";
import { catalogueQuery, type CatalogueFilters, hasActiveFilters } from "@/lib/catalogue";
import type { FacetCount } from "@/lib/catalogue-db";

function facetHref(f: CatalogueFilters, key: keyof CatalogueFilters, value: string | null): string {
  // Changing a facet always restarts at page 1 — otherwise a narrower filter
  // lands the visitor on an empty page 4 with no explanation.
  const qs = catalogueQuery(f, { [key]: value, page: null });
  return qs ? `/courses?${qs}` : "/courses";
}

function Group({
  title,
  paramKey,
  options,
  filters,
}: {
  title: string;
  paramKey: keyof CatalogueFilters;
  options: FacetCount[];
  filters: CatalogueFilters;
}) {
  if (options.length === 0) return null;
  const active = filters[paramKey] as string | null;

  return (
    <div>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">{title}</p>
      <ul className="space-y-1">
        {options.map((o) => {
          const isActive = active === o.value;
          return (
            <li key={o.value}>
              <Link
                href={facetHref(filters, paramKey, isActive ? null : o.value)}
                className={
                  isActive
                    ? "flex items-center justify-between gap-2 rounded-lg bg-plum-50 px-2 py-1.5 text-sm font-medium text-plum-700"
                    : "flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm text-ink-700 hover:bg-sunken"
                }
              >
                <span className="truncate">{o.value}</span>
                <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink-300">{o.count}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * The catalogue's facet rail. Pure links, no client JS — the same URL-param
 * approach `app/student/library/page.tsx` already uses, so a filtered
 * catalogue is shareable and back-button friendly.
 */
export function CourseFacets({
  filters,
  facets,
}: {
  filters: CatalogueFilters;
  facets: { domain: FacetCount[]; level: FacetCount[]; department: FacetCount[]; tier: FacetCount[] };
}) {
  return (
    <aside className="space-y-5">
      {hasActiveFilters(filters) && (
        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 rounded-lg border border-hair px-2.5 py-1.5 text-xs text-ink-500 transition-colors hover:border-plum-300 hover:text-ink-900"
        >
          <X className="size-3.5" />
          Clear filters
        </Link>
      )}
      <Group title="Domain" paramKey="domain" options={facets.domain} filters={filters} />
      <Group title="Level" paramKey="level" options={facets.level} filters={filters} />
      <Group title="Organisation" paramKey="department" options={facets.department} filters={filters} />
      <Group title="WMO tier" paramKey="tier" options={facets.tier} filters={filters} />
    </aside>
  );
}
