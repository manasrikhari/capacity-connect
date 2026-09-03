import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MarkdownRenderer from "@/components/ai/MarkdownRenderer";
import { Badge } from "@/components/ui/Badge";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = await prisma.announcement.findUnique({
    where: { slug },
    select: { title: true, summary: true, isPublished: true },
  });
  if (!a || !a.isPublished) return { title: "Announcement — Capacity Connect" };
  return {
    title: `${a.title} — Capacity Connect`,
    description: a.summary ?? undefined,
  };
}

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const announcement = await prisma.announcement.findUnique({ where: { slug } });

  // Drafts (and missing slugs) 404 publicly.
  if (!announcement || !announcement.isPublished) notFound();

  // Count the view only for published announcements.
  await prisma.announcement.update({
    where: { id: announcement.id },
    data: { viewCount: { increment: 1 } },
  });

  return (
    <main className="min-h-screen bg-page">
      <header className="border-b border-hair bg-paper">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 md:px-6">
          <Link
            href="/announcements"
            className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900"
          >
            <ArrowLeft className="size-4" />
            All announcements
          </Link>
          <Link href="/" className="text-sm text-plum-700 hover:underline">
            Capacity Connect
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge color="violet">{announcement.category}</Badge>
          {announcement.isFeatured && <Badge color="amber">Featured</Badge>}
          <span className="font-mono text-[11px] text-ink-300">
            {formatDate(announcement.publishedAt ?? announcement.createdAt)}
          </span>
        </div>

        <h1 className="font-display text-4xl font-normal leading-tight text-ink-900">
          {announcement.title}
        </h1>
        {announcement.summary && <p className="mt-3 text-lg text-ink-500">{announcement.summary}</p>}

        {announcement.bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={announcement.bannerUrl}
            alt=""
            className="mt-6 w-full rounded-2xl border border-hair object-cover"
          />
        )}

        <div className="mt-8 border-t border-hair pt-6">
          <MarkdownRenderer content={announcement.content} />
        </div>
      </article>
    </main>
  );
}
