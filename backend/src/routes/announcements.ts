import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AnnouncementService } from '../services/announcement.service';
import { requireAuth, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

const createAnnouncementSchema = z.object({
  title: z.string().min(3),
  summary: z.string().optional(),
  content: z.string().min(5),
  category: z.string().default('General'),
  bannerUrl: z.string().optional(),
  attachment: z.string().optional(),
  isPublished: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

/**
 * GET /api/announcements
 * Public list of announcements
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = req.query.category as string | undefined;
    const announcements = await AnnouncementService.getPublicAnnouncements(category);
    res.status(200).json({ success: true, data: announcements });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/announcements/:slug
 * Retrieve specific announcement by slug
 */
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    const announcement = await AnnouncementService.getAnnouncementBySlug(slug);
    if (!announcement) {
      res.status(404).json({ success: false, error: 'Announcement not found' });
      return;
    }
    res.status(200).json({ success: true, data: announcement });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/announcements
 * Create an announcement (Admin only)
 */
router.post(
  '/',
  requireAuth,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const validated = createAnnouncementSchema.parse(req.body);
      const announcement = await AnnouncementService.createAnnouncement(req.user!.id, validated);
      res.status(201).json({ success: true, data: announcement });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
