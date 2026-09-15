import { redirect } from "next/navigation";
import { AnnouncementTable } from "@/components/announcements/AnnouncementTable";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function PlatformAnnouncementsPage() {
  const session = await getSession();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/");

  const announcements = await prisma.announcement.findMany({
    orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      category: true,
      isPublished: true,
      isFeatured: true,
      viewCount: true,
      updatedAt: true,
    },
  });

  const published = announcements.filter((a) => a.isPublished).length;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-normal text-ink-900">Announcements</h1>
        <p className="mt-1 text-sm text-ink-500">
          Publish training-calendar notes, ministry advisories, and achievements to the public homepage.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            All announcements ({announcements.length})
            <span className="ml-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-300">
              {published} published
            </span>
          </CardTitle>
        </CardHeader>
        <AnnouncementTable announcements={announcements} />
      </Card>
    </div>
  );
}
