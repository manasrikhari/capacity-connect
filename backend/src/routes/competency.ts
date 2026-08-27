import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CompetencyService } from '../services/competency.service';
import { requireAuth, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

const createSkillSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional(),
});

const setProgramRequirementsSchema = z.object({
  requirements: z.array(
    z.object({
      skillId: z.string(),
      minProficiency: z.number().min(1).max(5),
      weight: z.number().min(0.1).default(1.0),
      isMandatory: z.boolean().default(true),
    })
  ),
});

const assignTrainerSchema = z.object({
  trainerId: z.string(),
  matchScore: z.number().min(0).max(100),
});

/**
 * GET /api/competency/skills
 * List all competency skills in taxonomy
 */
router.get('/skills', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const skills = await CompetencyService.getAllSkills();
    res.status(200).json({ success: true, data: skills });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/competency/skills
 * Create a new skill in taxonomy (Admin only)
 */
router.post(
  '/skills',
  requireAuth,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const validated = createSkillSchema.parse(req.body);
      const skill = await CompetencyService.createSkill(validated);
      res.status(201).json({ success: true, data: skill });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/competency/programs/:programId/requirements
 * Set competency prerequisites and skill requirements for a program
 */
router.post(
  '/programs/:programId/requirements',
  requireAuth,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const programId = req.params.programId as string;
      const validated = setProgramRequirementsSchema.parse(req.body);
      const result = await CompetencyService.setProgramSkillRequirements(
        programId,
        validated.requirements
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/competency/programs/:programId/match-trainers
 * Run trainer-to-program competency matching and ranking algorithm
 */
router.get(
  '/programs/:programId/match-trainers',
  requireAuth,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const programId = req.params.programId as string;
      const result = await CompetencyService.rankTrainersForProgram(programId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/competency/programs/:programId/assign-trainer
 * Assign a recommended trainer to a training program
 */
router.post(
  '/programs/:programId/assign-trainer',
  requireAuth,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const programId = req.params.programId as string;
      const validated = assignTrainerSchema.parse(req.body);
      const assignment = await CompetencyService.assignTrainerToProgram(
        programId,
        validated.trainerId,
        validated.matchScore
      );
      res.status(200).json({ success: true, data: assignment });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
