import { Megaphone } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { prisma } from "@/lib/prisma";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/taxonomy";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Announcements — Capacity Connect",
  description: "Training calendar, ministry advisories, and achievements from IMD's capacity-building programme.",
};

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const activeCategory =
    category && (ANNOUNCEMENT_CATEGORIES as readonly string[]).includes(category) ? category : null;

  const announcements = await prisma.announcement.findMany({
    where: { isPublished: true, ...(activeCategory ? { category: activeCategory } : {}) },
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      category: true,
      isFeatured: true,
      publishedAt: true,
      createdAt: true,
    },
  });

  return (
    <>
      <PublicHeader
        right={
          <Link href="/verify" className="text-sm text-plum-700 hover:underline">
            Verify a certificate
          </Link>
        }
      />

      <main id="main-content" tabIndex={-1} className="flex-1 bg-page">

      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <div className="mb-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-300">Ministry of Earth Sciences · India Meteorological Department</p>
          <h1 className="mt-2 font-display text-4xl font-normal text-ink-900">Announcements</h1>
          <p className="mt-2 max-w-2xl text-ink-500">
            Training calendar, ministry advisories, and achievements from India&apos;s national capacity-building
            programme for weather and climate services.
          </p>
        </div>

        {/* Category filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          <FilterChip label="All" href="/announcements" active={!activeCategory} />
          {ANNOUNCEMENT_CATEGORIES.map((c) => (
            <FilterChip
              key={c}
              label={c}
              href={`/announcements?category=${encodeURIComponent(c)}`}
              active={activeCategory === c}
            />
          ))}
        </div>

        {announcements.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No announcements yet"
            description={
              activeCategory ? `Nothing published under “${activeCategory}” yet.` : "Check back soon."
            }
          />
        ) : (
          <ul className="space-y-4">
            {announcements.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/announcements/${a.slug}`}
                  className="block rounded-2xl border border-hair bg-paper p-5 transition-colors hover:border-plum-300"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge color="violet">{a.category}</Badge>
                    {a.isFeatured && <Badge color="amber">Featured</Badge>}
                    <span className="font-mono text-[11px] text-ink-300">
                      {formatDate(a.publishedAt ?? a.createdAt)}
                    </span>
                  </div>
                  <h2 className="font-display text-xl font-normal text-ink-900">{a.title}</h2>
                  {a.summary && <p className="mt-1.5 text-sm text-ink-500">{a.summary}</p>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      </main>
    </>
  );
}

function FilterChip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-plum-600 px-3 py-1.5 text-xs font-medium text-paper"
          : "rounded-full border border-hair bg-paper px-3 py-1.5 text-xs font-medium text-ink-500 hover:border-plum-300 hover:text-ink-900"
      }
    >
      {label}
    </Link>
  );
}
