import { Router, Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { requireAuth, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

/**
 * GET /api/analytics/platform-summary
 * Platform KPI summary for admin dashboard
 */
router.get(
  '/platform-summary',
  requireAuth,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const summary = await AnalyticsService.getPlatformSummary();
      res.status(200).json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/analytics/departments
 * Department-wise distribution metrics
 */
router.get(
  '/departments',
  requireAuth,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const distribution = await AnalyticsService.getDepartmentDistribution();
      res.status(200).json({ success: true, data: distribution });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/analytics/competency-demand
 * In-demand skills vs available certified trainers
 */
router.get(
  '/competency-demand',
  requireAuth,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const metrics = await AnalyticsService.getCompetencySkillMetrics();
      res.status(200).json({ success: true, data: metrics });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
