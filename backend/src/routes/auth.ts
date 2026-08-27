import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiters';
import { Role } from '@prisma/client';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2),
  role: z.nativeEnum(Role).optional(),
  organization: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * POST /api/auth/register
 */
router.post('/register', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = registerSchema.parse(req.body);
    const result = await AuthService.register(validated);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = loginSchema.parse(req.body);
    const result = await AuthService.login(validated);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, error: 'Refresh token required' });
      return;
    }
    const tokens = await AuthService.refreshToken(refreshToken);
    res.status(200).json({ success: true, data: tokens });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const user = await AuthService.getCurrentUser(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

export default router;
