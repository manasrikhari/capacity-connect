import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { LivekitService } from '../services/livekit.service';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { livekitTokenLimiter } from '../middleware/rateLimiters';

const router = Router();

const tokenRequestSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
});

const startSessionSchema = z.object({
  programId: z.string().min(1),
  title: z.string().min(1),
});

/**
 * POST /api/livekit/token
 * Generate WebRTC token for LiveKit cloud connection
 */
router.post(
  '/token',
  livekitTokenLimiter,
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { roomId } = tokenRequestSchema.parse(req.body);
      const user = req.user!;

      const tokenData = await LivekitService.generateToken({
        roomId,
        userId: user.id,
        userName: user.fullName,
        role: user.role,
      });

      res.status(200).json({ success: true, data: tokenData });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/livekit/session/start
 * Trainer starts live interactive training session
 */
router.post(
  '/session/start',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const validated = startSessionSchema.parse(req.body);
      const session = await LivekitService.startSession(validated.programId, validated.title);
      res.status(201).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/livekit/session/:roomId/end
 * End live classroom session
 */
router.post(
  '/session/:roomId/end',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const roomId = req.params.roomId as string;
      const session = await LivekitService.endSession(roomId);
      res.status(200).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/livekit/webhook
 * LiveKit server Webhook handler
 */
router.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || '';
    // Express raw body or text
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const event = await LivekitService.handleWebhook(rawBody, authHeader);
    res.status(200).json({ success: true, received: event.event });
  } catch (error) {
    console.error('[LiveKit Webhook Verification Failed]', error);
    res.status(400).json({ success: false, error: 'Webhook validation failed' });
  }
});

export default router;
