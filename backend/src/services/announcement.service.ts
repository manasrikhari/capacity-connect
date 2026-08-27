import { db } from '../config/db';

export class AnnouncementService {
  static async getPublicAnnouncements(category?: string) {
    return db.announcement.findMany({
      where: {
        isPublished: true,
        ...(category && category !== 'All' ? { category } : {}),
      },
      include: {
        author: {
          select: {
            fullName: true,
            role: true,
          },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  static async getAnnouncementBySlug(slug: string) {
    const item = await db.announcement.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            fullName: true,
            role: true,
            organization: true,
          },
        },
      },
    });

    if (item && item.isPublished) {
      // Increment view count asynchronously
      await db.announcement.update({
        where: { id: item.id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return item;
  }

  static async createAnnouncement(
    authorId: string,
    data: {
      title: string;
      summary?: string;
      content: string;
      category?: string;
      bannerUrl?: string;
      attachment?: string;
      isPublished?: boolean;
      isFeatured?: boolean;
    }
  ) {
    const slug = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

    return db.announcement.create({
      data: {
        title: data.title,
        slug,
        summary: data.summary,
        content: data.content,
        category: data.category || 'General',
        bannerUrl: data.bannerUrl,
        attachment: data.attachment,
        isPublished: data.isPublished ?? true,
        isFeatured: data.isFeatured ?? false,
        publishedAt: data.isPublished ? new Date() : null,
        authorId,
      },
    });
  }
}
