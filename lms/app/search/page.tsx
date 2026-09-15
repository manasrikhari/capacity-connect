import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { GOV } from "@/lib/gigw";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Search — Capacity Connect",
  description: "Search published announcements and the public course catalogue.",
};

async function runSearch(q: string) {
  const term = q.trim();
  if (term.length < 2) return { announcements: [], courses: [] };
  const [announcements, courses] = await Promise.all([
    prisma.announcement.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: term, mode: "insensitive" } },
          { summary: { contains: term, mode: "insensitive" } },
          { content: { contains: term, mode: "insensitive" } },
        ],
      },
      select: { slug: true, title: true, summary: true, category: true },
      orderBy: { publishedAt: "desc" },
      take: 20,
    }),
    prisma.batch.findMany({
      // Handle is `slug ?? id` (mirrors CourseCard); most seeded batches have no
      // slug yet, so we must not filter them out.
      where: {
        status: "ACTIVE",
        teacher: { status: { not: "SUSPENDED" } },
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
        ],
      },
      select: { id: true, slug: true, name: true, description: true, wmoTier: true },
      orderBy: { name: "asc" },
      take: 20,
    }),
  ]);
  return { announcements, courses };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const term = q.trim();
  const { announcements, courses } = term ? await runSearch(term) : { announcements: [], courses: [] };
  const total = announcements.length + courses.length;

  return (
    <>
      <PublicHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 bg-page">
        <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-300">
            {GOV.ministry} · {GOV.department}
          </p>
          <h1 className="mt-2 font-display text-4xl font-normal text-ink-900">Search</h1>

          <form role="search" action="/search" method="get" className="mt-6 flex gap-2">
            <label htmlFor="q" className="sr-only">Search announcements and courses</label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={term}
              placeholder="Search announcements and courses…"
              className="w-full rounded-[10px] border border-hair bg-paper px-3 py-2 text-ink-900 outline-none focus:border-plum-300 focus:ring-2 focus:ring-plum-100"
            />
            <button
              type="submit"
              className="shrink-0 rounded-[10px] bg-plum-600 px-4 py-2 text-[14px] font-medium text-paper transition-colors hover:bg-plum-700 active:scale-[0.97]"
            >
              Search
            </button>
          </form>

          {term ? (
            <p className="mt-4 text-[13px] text-ink-500">
              {total} result{total === 1 ? "" : "s"} for &ldquo;{term}&rdquo;
            </p>
          ) : (
            <p className="mt-4 text-[13px] text-ink-500">
              Enter a term to search published announcements and the public course catalogue.
            </p>
          )}

          {courses.length > 0 && (
            <section className="mt-8">
              <h2 className="border-b border-hair-strong pb-2 text-[14px] font-semibold text-ink-900">Courses</h2>
              <ul className="mt-3 space-y-3">
                {courses.map((c) => (
                  <li key={c.id}>
                    <Link href={`/courses/${c.slug ?? c.id}`} className="font-display text-lg text-plum-700 underline-offset-4 hover:underline">
                      {c.name}
                    </Link>
                    {c.wmoTier ? <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">{c.wmoTier}</span> : null}
                    {c.description ? <p className="mt-0.5 line-clamp-2 text-[14px] text-ink-700">{c.description}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {announcements.length > 0 && (
            <section className="mt-8">
              <h2 className="border-b border-hair-strong pb-2 text-[14px] font-semibold text-ink-900">Announcements</h2>
              <ul className="mt-3 space-y-3">
                {announcements.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/announcements/${a.slug}`} className="font-display text-lg text-plum-700 underline-offset-4 hover:underline">
                      {a.title}
                    </Link>
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">{a.category}</span>
                    {a.summary ? <p className="mt-0.5 line-clamp-2 text-[14px] text-ink-700">{a.summary}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {term && total === 0 && (
            <div className="mt-8 rounded-2xl border border-dashed border-hair-strong bg-sunken/40 p-6 text-ink-500">
              Nothing matched &ldquo;{term}&rdquo;. Try a different term, or browse{" "}
              <Link href="/announcements" className="font-medium text-plum-700 underline underline-offset-4">announcements</Link>{" "}
              and <Link href="/courses" className="font-medium text-plum-700 underline underline-offset-4">courses</Link>.
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
