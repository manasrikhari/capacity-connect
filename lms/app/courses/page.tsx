import { CalendarDays, GraduationCap, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CourseCard } from "@/components/courses/CourseCard";
import { CourseFacets } from "@/components/courses/CourseFacets";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import {
  CATALOGUE_SORTS,
  catalogueQuery,
  type CatalogueParams,
  parseCatalogueParams,
  SORT_LABEL,
} from "@/lib/catalogue";
import { searchCatalogue } from "@/lib/catalogue-db";

export const metadata: Metadata = {
  title: "Courses — Capacity Connect",
  description:
    "Browse the national capacity-building catalogue for weather and climate services — WMO-aligned training from IMD, NCMRWF, INCOIS and IITM.",
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<CatalogueParams>;
}) {
  const filters = parseCatalogueParams(await searchParams);
  const { courses, total, pageCount, facets } = await searchCatalogue(filters);

  return (
    <>
      <PublicHeader
        right={
          <div className="flex items-center gap-4">
            <Link href="/calendar" className="text-sm text-plum-700 hover:underline">
              Training calendar
            </Link>
            <Link href="/verify" className="text-sm text-plum-700 hover:underline">
              Verify a certificate
            </Link>
          </div>
        }
      />

      <main className="flex-1 bg-page">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
          <div className="mb-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-300">
              Ministry of Earth Sciences · Capacity building
            </p>
            <h1 className="mt-2 font-display text-4xl font-normal text-ink-900">Courses</h1>
            <p className="mt-2 max-w-2xl text-ink-500">
              Every training programme currently offered across IMD, NCMRWF, INCOIS and IITM. Browse by
              domain or WMO tier, then request a place — your organisation&apos;s training coordinator can
              also nominate you.
            </p>
          </div>

          {/* Search and sort — a plain GET form, so results stay linkable. */}
          <form method="get" className="mb-6 flex flex-wrap gap-3">
            {filters.domain && <input type="hidden" name="domain" value={filters.domain} />}
            {filters.level && <input type="hidden" name="level" value={filters.level} />}
            {filters.department && <input type="hidden" name="department" value={filters.department} />}
            {filters.tier && <input type="hidden" name="tier" value={filters.tier} />}
            {filters.past && <input type="hidden" name="past" value="1" />}
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300" />
              <Input
                name="q"
                defaultValue={filters.q}
                placeholder="Search courses — radar, monsoon, satellite…"
                className="pl-9"
                aria-label="Search courses"
              />
            </div>
            <Select
              name="sort"
              defaultValue={filters.sort}
              aria-label="Sort courses"
              className="w-auto"
            >
              {CATALOGUE_SORTS.map((s) => (
                <option key={s} value={s}>
                  {SORT_LABEL[s]}
                </option>
              ))}
            </Select>
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-plum-600 px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-plum-700"
            >
              Search
            </button>
          </form>

          <div className="grid gap-8 lg:grid-cols-[13rem_1fr]">
            <CourseFacets filters={filters} facets={facets} />

            <div className="min-w-0">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm text-ink-500">
                  {total} course{total === 1 ? "" : "s"}
                  {filters.q ? ` matching “${filters.q}”` : ""}
                </p>
                <Link
                  href={`/courses${
                    catalogueQuery(filters, { past: filters.past ? null : "1", page: null })
                      ? `?${catalogueQuery(filters, { past: filters.past ? null : "1", page: null })}`
                      : ""
                  }`}
                  className="text-xs text-plum-600 hover:underline"
                >
                  {filters.past ? "Hide completed courses" : "Include completed courses"}
                </Link>
              </div>

              {courses.length === 0 ? (
                <EmptyState
                  icon={GraduationCap}
                  title="No courses match"
                  description="Try removing a filter, or browse the training calendar for what is coming up."
                />
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {courses.map((c) => (
                    <CourseCard key={c.id} course={c} />
                  ))}
                </ul>
              )}

              <Pagination
                page={filters.page}
                pageCount={pageCount}
                basePath="/courses"
                params={{
                  q: filters.q || undefined,
                  domain: filters.domain ?? undefined,
                  level: filters.level ?? undefined,
                  department: filters.department ?? undefined,
                  tier: filters.tier ?? undefined,
                  sort: filters.sort === "starting" ? undefined : filters.sort,
                  past: filters.past ? "1" : undefined,
                }}
              />

              <p className="mt-8 flex items-center gap-2 text-sm text-ink-500">
                <CalendarDays className="size-4 text-ink-300" />
                Looking for dates?{" "}
                <Link href="/calendar" className="text-plum-600 hover:underline">
                  See the training calendar
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
