import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { FeedbackService } from '../services/feedback.service';
import { requireAuth, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

const submitFeedbackSchema = z.object({
  programId: z.string(),
  trainerId: z.string().optional(),
  overallRating: z.number().min(1).max(5),
  contentRating: z.number().min(1).max(5).optional(),
  trainerRating: z.number().min(1).max(5).optional(),
  infrastructureRating: z.number().min(1).max(5).optional(),
  comments: z.string().optional(),
  suggestions: z.string().optional(),
});

/**
 * POST /api/feedback
 * Trainee submits rating and reviews
 */
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = submitFeedbackSchema.parse(req.body);
    const feedback = await FeedbackService.submitFeedback({
      ...validated,
      traineeId: req.user!.id,
    });
    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/feedback/program/:programId
 * Get aggregate feedback summary and reviews for a program
 */
router.get(
  '/program/:programId',
  requireAuth,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN, Role.TRAINER]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const programId = req.params.programId as string;
      const summary = await FeedbackService.getProgramFeedbackSummary(programId);
      res.status(200).json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
