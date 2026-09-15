import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AnnouncementForm } from "@/components/announcements/AnnouncementForm";
import { Card } from "@/components/ui/Card";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/");

  const { id } = await params;
  const announcement = await prisma.announcement.findUnique({ where: { id } });
  if (!announcement) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/platform/announcements"
          className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900"
        >
          <ArrowLeft className="size-4" />
          Announcements
        </Link>
        {announcement.isPublished && (
          <Link
            href={`/announcements/${announcement.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-plum-700 hover:underline"
          >
            View public page
            <ExternalLink className="size-3.5" />
          </Link>
        )}
      </div>

      <div>
        <h1 className="font-display text-2xl font-normal text-ink-900">Edit announcement</h1>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-300">
          /announcements/{announcement.slug}
        </p>
      </div>

      <Card>
        <AnnouncementForm
          announcement={{
            id: announcement.id,
            title: announcement.title,
            summary: announcement.summary,
            content: announcement.content,
            category: announcement.category,
            bannerUrl: announcement.bannerUrl,
            isFeatured: announcement.isFeatured,
            isPublished: announcement.isPublished,
          }}
          redirectTo="/platform/announcements"
        />
      </Card>
    </div>
  );
}
