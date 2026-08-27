import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AccessToken } from 'livekit-server-sdk';
import { ENV } from '../config/env';
import { db } from '../config/db';
import { requestAI, transcribeImage } from '../services/ai-provider';

const router = Router();

const LMS_JWT_SECRET = process.env.LMS_JWT_SECRET || '4bf8a2b5efc19688b14e6b12a875a5cb8227b686d06126f595df87cf3c1be0aa';
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || '35c60da6e053a479b1d9bf5b27ac28b9d311fa6771d9d71c4c8d5dcd295feab0';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'd3d81b8d2acb6c2ba6cfcb5a2b0ac2825b410fb595bf87cf3c2be0b4845de2aa';

/**
 * POST /api/exchange-lms-token
 * Receives JWT from LMS and converts it to classroom access & refresh tokens
 */
router.post('/exchange-lms-token', async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ error: 'LMS token is required' });
    return;
  }

  try {
    let decoded: any;
    try {
      decoded = jwt.verify(token, LMS_JWT_SECRET, { algorithms: ['HS256'], clockTolerance: 300 });
    } catch (jwtErr: any) {
      console.warn(`[JWT Verify Attempt 1 failed]: ${jwtErr.message}. Trying fallback decode...`);
      // Also try with Buffer secret if string secret failed
      try {
        decoded = jwt.verify(token, Buffer.from(LMS_JWT_SECRET, 'utf-8'), { algorithms: ['HS256'], clockTolerance: 300 });
      } catch (jwtErr2: any) {
        console.error(`[JWT Verify Error]: ${jwtErr2.message}`);
        throw jwtErr2;
      }
    }

    const userEmail = decoded.email;
    const userName = decoded.name || 'Participant';
    const rawRole = decoded.role;
    const meetingId = decoded.meetingId;

    if (!userEmail || !meetingId) {
      res.status(400).json({ error: 'Invalid LMS token payload' });
      return;
    }

    // Check if user exists in database
    let user = await db.user.findUnique({
      where: { email: userEmail.toLowerCase() },
    });

    let userId: string;
    let finalRole: string = rawRole;

    if (!user) {
      const assignedRole = (rawRole === 'teacher' || rawRole === 'ADMIN' || rawRole === 'TRAINER') ? 'ADMIN' : 'TRAINEE';
      user = await db.user.create({
        data: {
          id: decoded.userId || decoded.id,
          email: userEmail.toLowerCase(),
          password: 'SSO_MANAGED_LOGIN',
          fullName: userName,
          role: assignedRole as any,
          status: 'APPROVED',
        },
      });
      userId = user.id;
      finalRole = user.role;
    } else {
      if (user.status === 'SUSPENDED' || user.status === 'REJECTED') {
        res.status(403).json({ error: 'Your account is suspended or rejected.' });
        return;
      }
      userId = user.id;
      finalRole = user.role;
    }

    const isTeacher = finalRole === 'ADMIN' || finalRole === 'TRAINER' || rawRole === 'teacher';

    // Verify session
    let liveSession = await db.liveSession.findUnique({
      where: { roomId: meetingId },
    });

    if (!liveSession) {
      if (isTeacher) {
        // Resolve programId/batchId
        let programId = decoded.batchId;
        if (!programId) {
          const firstProg = await db.program.findFirst();
          programId = firstProg?.id || 'default-program';
        }

        liveSession = await db.liveSession.create({
          data: {
            programId: programId!,
            roomId: meetingId,
            title: `Live Session - ${meetingId}`,
            status: 'LIVE',
            scheduledStart: new Date(),
            scheduledEnd: new Date(Date.now() + 2 * 60 * 60 * 1000),
            actualStart: new Date(),
          },
        });
      } else {
        // For student, auto-allow or check session
        const firstProg = await db.program.findFirst();
        liveSession = await db.liveSession.create({
          data: {
            programId: decoded.batchId || firstProg?.id || 'default-program',
            roomId: meetingId,
            title: `Live Session - ${meetingId}`,
            status: 'LIVE',
            scheduledStart: new Date(),
            scheduledEnd: new Date(Date.now() + 2 * 60 * 60 * 1000),
            actualStart: new Date(),
          },
        });
      }
    }

    const nativeRole = isTeacher ? 'teacher' : 'student';
    const claims = {
      userId,
      role: nativeRole,
      roomId: meetingId,
      batchId: liveSession.programId,
      name: userName,
      email: userEmail,
    };

    const accessToken = jwt.sign(
      { ...claims, type: 'access' },
      ACCESS_TOKEN_SECRET,
      { expiresIn: '4h' }
    );

    const refreshToken = jwt.sign(
      { ...claims, type: 'refresh' },
      REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    const startedAtMs = new Date(liveSession.scheduledStart || Date.now()).getTime();

    res.json({
      accessToken,
      refreshToken,
      roomName: meetingId,
      startedAtMs,
    });
  } catch (error) {
    console.error('[Live Exchange LMS token error]', error);
    res.status(401).json({ error: 'Invalid or expired LMS token' });
  }
});

/**
 * POST /api/token
 * Generate LiveKit token using classroom session token
 */
router.post('/token', async (req: Request, res: Response): Promise<void> => {
  const { roomName, sessionToken, isOverlay } = req.body;

  if (!roomName || !sessionToken) {
    res.status(400).json({ error: 'roomName and sessionToken are required' });
    return;
  }

  try {
    const decoded = jwt.verify(sessionToken, ACCESS_TOKEN_SECRET) as {
      userId: string;
      role: string;
      name: string;
      roomId: string;
      type: string;
    };

    if (decoded.type !== 'access') {
      res.status(401).json({ error: 'Invalid token type' });
      return;
    }

    const participantIdentity = isOverlay ? `${decoded.userId}-overlay` : decoded.userId;
    const participantName = isOverlay ? `${decoded.name} (Overlay)` : decoded.name;

    const at = new AccessToken(ENV.LIVEKIT_API_KEY, ENV.LIVEKIT_API_SECRET, {
      identity: participantIdentity,
      name: participantName,
      ttl: '4h',
    });

    at.metadata = decoded.role;

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();
    res.json({ token });
  } catch (error) {
    console.error('[Live Token generation error]', error);
    res.status(401).json({ error: 'Invalid or expired session token' });
  }
});

/**
 * GET /api/turn
 * Return Metered STUN / TURN server credentials
 */
router.get('/turn', async (_req: Request, res: Response) => {
  const apiKey = process.env.METERED_API_KEY || 'f14f187d2a8b2bc5b82f20aaff39bda30f99';
  const appName = process.env.METERED_APP_NAME || 'opengrapes';

  try {
    const response = await fetch(`https://${appName}.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`);
    if (response.ok) {
      const iceServers = await response.json();
      res.json({ iceServers });
      return;
    }
  } catch (e) {
    console.warn('[TURN Fallback] Could not fetch Metered credentials, using default STUN');
  }

  res.json({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
    ],
  });
});

/**
 * POST /api/doubt/ask
 * AI doubt solver with LaTeX & diagram OCR
 */
router.post('/doubt/ask', async (req: Request, res: Response) => {
  const { doubt, attachedImage, topicNotes, history } = req.body;

  try {
    let ocrText = '';
    if (attachedImage) {
      ocrText = await transcribeImage(attachedImage);
    }

    const contextPrompt = `
Class Topic Context: ${topicNotes || 'General Live Training'}
${ocrText ? `Transcribed Image/Diagram LaTeX: ${ocrText}` : ''}
${history ? `Previous Chat History:\n${history}` : ''}
`;

    const answer = await requestAI(
      doubt || 'Please explain this question step-by-step.',
      contextPrompt,
      'You are an expert AI tutor in a live interactive classroom. Provide clear step-by-step explanations with LaTeX math formatting where appropriate.'
    );

    res.json({
      answer,
      ocrText: ocrText || undefined,
    });
  } catch (error: any) {
    console.error('[Doubt Ask Error]', error);
    res.status(500).json({ error: 'Failed to process doubt' });
  }
});

/**
 * POST /api/end-class
 */
router.post('/end-class', async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Class session ended' });
});

export default router;
