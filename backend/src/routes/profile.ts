import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ProfileService } from '../services/profile.service';
import { requireAuth, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

const updateProfileSchema = z.object({
  fullName: z.string().optional(),
  bio: z.string().optional(),
  qualifications: z.string().optional(),
  yearsExperience: z.number().min(0).optional(),
  resumeUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  organization: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  avatarUrl: z.string().optional(),
  interests: z.array(z.string()).optional(),
});

const addSkillSchema = z.object({
  skillName: z.string().min(1),
  category: z.string().default('General'),
  proficiency: z.number().min(1).max(5),
  yearsExperience: z.number().min(0).default(1),
});

/**
 * GET /api/profile/me
 */
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await ProfileService.getProfileByUserId(req.user!.id);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/profile/:userId
 */
router.get('/:userId', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId as string;
    const profile = await ProfileService.getProfileByUserId(userId);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/profile/me
 */
router.put('/me', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = updateProfileSchema.parse(req.body);
    const updated = await ProfileService.updateProfile(req.user!.id, validated);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/profile/trainer/skills
 */
router.post(
  '/trainer/skills',
  requireAuth,
  requireRole([Role.TRAINER, Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const validated = addSkillSchema.parse(req.body);
      const skill = await ProfileService.addTrainerSkill(req.user!.id, validated);
      res.status(201).json({ success: true, data: skill });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/profile/trainer/skills
 */
router.get(
  '/trainer/skills',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const skills = await ProfileService.getTrainerSkills(req.user!.id);
      res.status(200).json({ success: true, data: skills });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
