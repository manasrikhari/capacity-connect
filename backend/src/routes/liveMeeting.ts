import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { AccessToken, TrackSource } from 'livekit-server-sdk';
import { ENV } from '../config/env';
import { db } from '../config/db';
import { roomServiceClient } from '../config/livekit';
import { requestAI, isAIConfigured, transcribeAudio } from '../services/ai-provider';
import { TranscriptService } from '../services/transcript.service';
import {
  LiveClassroomService,
  ClassroomClaims,
  ClassroomTokenPayload,
} from '../services/liveClassroom.service';
import { PresenceService } from '../services/presence.service';
import { RecordingService } from '../services/recording.service';
import { AppError } from '../utils/appError';

const router = Router();

// Audio chunks arrive as multipart; keep them in memory (they're short VAD
// utterances) and cap the size so a bad client can't blow up the process.
const uploadAudio = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

interface ClassroomRequest extends Request {
  classroom?: ClassroomTokenPayload;
}

/** Require a valid classroom access token in the Authorization header. */
const requireClassroomToken = (req: ClassroomRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization token required' });
    return;
  }
  try {
    req.classroom = LiveClassroomService.verifyAccessToken(authHeader.slice(7));
    next();
  } catch (err) {
    next(err); // AppError 401 / 503 handled by the global errorHandler
  }
};

/** Require the classroom token to belong to the teacher. */
const requireTeacher = (req: ClassroomRequest, res: Response, next: NextFunction): void => {
  if (req.classroom?.role !== 'teacher') {
    res.status(403).json({ error: 'Only the teacher can perform this action' });
    return;
  }
  next();
};

/**
 * POST /api/exchange-lms-token
 * Receives JWT from LMS and converts it to classroom access & refresh tokens.
 */
router.post('/exchange-lms-token', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { token } = req.body || {};
  if (!token) {
    res.status(400).json({ error: 'LMS token is required' });
    return;
  }

  try {
    let decoded: ReturnType<typeof LiveClassroomService.verifyLmsHandoffToken>;
    try {
      decoded = LiveClassroomService.verifyLmsHandoffToken(token);
    } catch (jwtErr: any) {
      if (jwtErr instanceof AppError) throw jwtErr; // 503 config error
      console.error(`[Live Exchange] LMS token verification failed: ${jwtErr?.message || jwtErr}`);
      res.status(401).json({ error: 'Invalid or expired LMS token' });
      return;
    }

    const userEmail = decoded.email;
    const userName = decoded.name || 'Participant';
    const rawRole = decoded.role;
    const meetingId = decoded.meetingId;
    const lmsBatchId = decoded.batchId || null;
    const lmsUserId = decoded.userId || decoded.id;

    if (!userEmail || !meetingId) {
      res.status(400).json({ error: 'Invalid LMS token payload' });
      return;
    }

    let user: { id: string; status?: string; role?: string } | null = null;
    try {
      const rows: any[] = await db.$queryRawUnsafe(
        'SELECT id, email, status, role FROM "User" WHERE LOWER(email) = $1 LIMIT 1',
        userEmail.toLowerCase()
      );
      if (rows && rows.length > 0) {
        user = rows[0];
      }
    } catch (dbErr: any) {
      console.warn('[liveMeeting] Warning: user lookup via DB failed, using token claims:', dbErr?.message || dbErr);
    }

    if (user && (user.status === 'SUSPENDED' || user.status === 'REJECTED')) {
      res.status(403).json({ error: 'Your account is suspended or rejected.' });
      return;
    }

    const effectiveUserId = user?.id || lmsUserId || userEmail;
    const isTeacher =
      rawRole === 'teacher' ||
      rawRole === 'TRAINER' ||
      user?.role === 'ADMIN' ||
      user?.role === 'TRAINER' ||
      user?.role === 'SUPER_ADMIN';
    const nativeRole: 'teacher' | 'student' = isTeacher ? 'teacher' : 'student';

    let liveSession: any = null;
    try {
      liveSession = await LiveClassroomService.findOrCreateSession(meetingId, effectiveUserId, lmsBatchId);
    } catch (sessionErr: any) {
      console.warn('[liveMeeting] Session initialization fallback:', sessionErr?.message || sessionErr);
    }

    const claims: ClassroomClaims = {
      userId: effectiveUserId,
      lmsUserId: lmsUserId || effectiveUserId,
      role: nativeRole,
      roomId: meetingId,
      roomName: meetingId,
      batchId: lmsBatchId,
      name: userName,
      email: userEmail,
    };

    const { accessToken, refreshToken } = LiveClassroomService.issueTokenPair(claims);

    if (nativeRole === 'teacher') {
      // Fire-and-forget: tell the LMS the session has started.
      LiveClassroomService.notifyLms('/api/live/session-started', meetingId, lmsBatchId, {
        roomId: meetingId,
        batchId: lmsBatchId,
      });
      // Begin recording the class (no-op unless S3 egress is configured).
      void RecordingService.start(meetingId);
    }

    const startedAtMs = new Date(
      liveSession?.actualStart || liveSession?.startedAt || liveSession?.scheduledStart || Date.now()
    ).getTime();

    res.json({
      accessToken,
      refreshToken,
      roomName: meetingId,
      startedAtMs,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/renew-session
 * Verify the refresh token and re-issue an access + refresh pair carrying the same claims.
 */
router.post('/renew-session', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      res.status(400).json({ error: 'refreshToken is required' });
      return;
    }

    const decoded = LiveClassroomService.verifyRefreshToken(refreshToken);
    const pair = LiveClassroomService.issueTokenPair(LiveClassroomService.toClaims(decoded));

    res.json({ accessToken: pair.accessToken, refreshToken: pair.refreshToken });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/exchange-session
 * Handoff-code exchange is not supported; the live client redirects to the LMS on failure.
 */
router.post('/exchange-session', (_req: Request, res: Response): void => {
  res.status(501).json({ error: 'code exchange not supported' });
});

/**
 * GET /api/livekit-url
 */
router.get('/livekit-url', (_req: Request, res: Response): void => {
  res.json({ url: ENV.LIVEKIT_URL });
});

/**
 * POST /api/token
 * Generate a LiveKit token using a classroom session (access) token.
 * Teacher keeps host privileges (roomAdmin/roomCreate); client reads metadata === 'teacher'.
 */
router.post('/token', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { roomName, sessionToken, isOverlay } = req.body || {};

  if (!roomName || !sessionToken) {
    res.status(400).json({ error: 'roomName and sessionToken are required' });
    return;
  }

  try {
    const decoded = LiveClassroomService.verifyAccessToken(sessionToken);

    const participantIdentity = isOverlay ? `${decoded.userId}-overlay` : decoded.userId;
    const participantName = isOverlay ? `${decoded.name} (Overlay)` : decoded.name;
    const isTeacher = decoded.role === 'teacher';

    const at = new AccessToken(ENV.LIVEKIT_API_KEY, ENV.LIVEKIT_API_SECRET, {
      identity: participantIdentity,
      name: participantName,
      ttl: '4h',
    });

    // The live client relies on participant.metadata === 'teacher' for host UI.
    at.metadata = decoded.role;

    // Record the identity→LMS-user mapping now, while we hold both ids, so the
    // participant_joined/left webhooks can attribute presence for attendance.
    if (!isOverlay) {
      PresenceService.registerParticipant(
        roomName,
        decoded.batchId,
        participantIdentity,
        decoded.lmsUserId,
        decoded.name,
      );
    }

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: isTeacher,
      roomCreate: isTeacher,
    });

    const token = await at.toJwt();
    res.json({ token });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/turn
 * Return Metered STUN/TURN credentials, or STUN-only servers when METERED_API_KEY is unset.
 */
router.get('/turn', async (_req: Request, res: Response): Promise<void> => {
  const stunOnly = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
    ],
  };

  if (!ENV.METERED_API_KEY) {
    res.json(stunOnly);
    return;
  }

  try {
    const response = await fetch(
      `https://${ENV.METERED_APP_NAME}.metered.live/api/v1/turn/credentials?apiKey=${ENV.METERED_API_KEY}`
    );
    if (response.ok) {
      const iceServers = await response.json();
      res.json({ iceServers });
      return;
    }
    console.warn(`[TURN Fallback] Metered responded with HTTP ${response.status}, using default STUN`);
  } catch (e) {
    console.warn('[TURN Fallback] Could not fetch Metered credentials, using default STUN');
  }

  res.json(stunOnly);
});

/**
 * POST /api/mute-participant
 * Teacher-only: mute/unmute a participant's mic or camera track via LiveKit.
 */
router.post(
  '/mute-participant',
  requireClassroomToken,
  requireTeacher,
  async (req: ClassroomRequest, res: Response): Promise<void> => {
    const { roomId, participantIdentity, trackType, muted } = req.body || {};

    if (!roomId || !participantIdentity || (trackType !== 'audio' && trackType !== 'video')) {
      res.status(400).json({ error: 'roomId, participantIdentity and trackType (audio|video) are required' });
      return;
    }

    try {
      const participant = await roomServiceClient.getParticipant(roomId, participantIdentity);
      const targetSource = trackType === 'audio' ? TrackSource.MICROPHONE : TrackSource.CAMERA;
      const tracks = (participant.tracks || []).filter((t) => t.source === targetSource);

      if (tracks.length === 0) {
        res.json({ success: true, message: 'No matching published track found' });
        return;
      }

      await Promise.all(
        tracks.map((t) => roomServiceClient.mutePublishedTrack(roomId, participantIdentity, t.sid, !!muted))
      );

      res.json({ success: true });
    } catch (error: any) {
      console.error('[Mute Participant] Failed:', error?.message || error);
      res.status(500).json({ error: 'Failed to change mute state' });
    }
  }
);

/**
 * POST /api/kick-participant
 * Teacher-only: remove a participant from the LiveKit room.
 */
router.post(
  '/kick-participant',
  requireClassroomToken,
  requireTeacher,
  async (req: ClassroomRequest, res: Response): Promise<void> => {
    const { roomId, participantIdentity } = req.body || {};

    if (!roomId || !participantIdentity) {
      res.status(400).json({ error: 'roomId and participantIdentity are required' });
      return;
    }

    try {
      await roomServiceClient.removeParticipant(roomId, participantIdentity);
      res.json({ success: true });
    } catch (error: any) {
      console.error('[Kick Participant] Failed:', error?.message || error);
      res.status(500).json({ error: 'Failed to kick participant' });
    }
  }
);

/**
 * POST /api/doubt
 * SSE stream of the AI tutor's answer ({thinking}/{text} chunks, "data: [DONE]" terminator),
 * then persists the doubt and notifies the LMS.
 */
router.post('/doubt', requireClassroomToken, async (req: ClassroomRequest, res: Response): Promise<void> => {
  const claims = req.classroom!;
  const { doubtText, screenshot } = req.body || {};
  const question =
    (typeof doubtText === 'string' && doubtText.trim()) || 'Please explain the attached question step-by-step.';
  const screenshotValue: string | null = typeof screenshot === 'string' && screenshot ? screenshot : null;

  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (payload: Record<string, unknown>): void => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  let answer = '';
  try {
    if (isAIConfigured()) {
      answer = await requestAI(
        question,
        `Live classroom room: ${claims.roomName}. Student: ${claims.name}.`,
        'You are an expert AI tutor in a live interactive classroom. Provide clear step-by-step explanations with LaTeX math formatting where appropriate.'
      );
      // requestAI is non-streaming: chunk the full answer into SSE text events.
      const CHUNK_SIZE = 80;
      for (let i = 0; i < answer.length; i += CHUNK_SIZE) {
        send({ text: answer.slice(i, i + CHUNK_SIZE) });
      }
    } else {
      answer = "The AI tutor isn't configured on this server.";
      send({ text: answer });
    }
  } catch (error: any) {
    console.error('[Doubt] AI request failed:', error?.message || error);
    if (!answer) {
      answer = 'Sorry, the AI tutor ran into an error while answering. Please try again.';
      send({ text: answer });
    }
  }

  // Persist BEFORE the [DONE] signal so the client's immediate history refetch sees the new doubt.
  try {
    const session = await LiveClassroomService.findOrCreateSession(claims.roomId, claims.userId);
    await db.meetingDoubt.create({
      data: {
        sessionId: session.id,
        studentId: claims.userId,
        question,
        answer,
        screenshot: screenshotValue,
      },
    });
  } catch (persistErr: any) {
    console.error('[Doubt] Failed to persist doubt:', persistErr?.message || persistErr);
  }

  // Fire-and-forget mirror to the LMS.
  LiveClassroomService.notifyLms('/api/live/doubt', claims.roomId, claims.batchId, {
    lmsUserId: claims.lmsUserId,
    doubtText: question,
    answer,
    screenshot: screenshotValue,
  });

  res.write('data: [DONE]\n\n');
  res.end();
});

/**
 * GET /api/doubts/:sessionId
 * Doubts for this room, shaped for the live client's DoubtSolverTab.
 * Students only see their own doubts; the teacher sees all.
 */
router.get(
  '/doubts/:sessionId',
  requireClassroomToken,
  async (req: ClassroomRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const claims = req.classroom!;
      const roomId = req.params.sessionId as string;

      // The classroom token is scoped to a single room.
      if (roomId !== claims.roomId) {
        res.status(403).json({ error: 'Token is not valid for this room' });
        return;
      }

      const session = await db.liveSession.findUnique({ where: { roomId } });
      if (!session) {
        res.json({ doubts: [] });
        return;
      }

      const where: { sessionId: string; studentId?: string } = { sessionId: session.id };
      if (claims.role !== 'teacher') {
        where.studentId = claims.userId;
      }

      const doubts = await db.meetingDoubt.findMany({
        where,
        include: { student: { select: { fullName: true } } },
        orderBy: { createdAt: 'asc' },
      });

      res.json({
        doubts: doubts.map((d) => ({
          id: d.id,
          session_id: roomId,
          student_id: d.studentId,
          studentName: d.student?.fullName || 'Student',
          doubt_text: d.question,
          answer: d.answer || '',
          screenshot: d.screenshot,
          // Client renders new Date(timestamp + ' UTC') — send "YYYY-MM-DD HH:mm:ss" in UTC.
          timestamp: d.createdAt.toISOString().replace('T', ' ').slice(0, 19),
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/summary/:sessionId
 * Return the latest cached rolling summary for the room (null until one is
 * triggered), so the classroom's summary tab can poll cheaply.
 */
router.get('/summary/:sessionId', requireClassroomToken, (req: ClassroomRequest, res: Response): void => {
  const roomId = req.params.sessionId as string;
  res.json({ rollingSummary: TranscriptService.getSummary(roomId), topicNotes: null });
});

/**
 * POST /api/summary/trigger
 * Distil the transcript so far into a short rolling summary via the AI provider,
 * cache it, and return it. Degrades to a quiet failure when AI is unconfigured
 * or the transcript is still empty.
 */
router.post('/summary/trigger', requireClassroomToken, async (req: ClassroomRequest, res: Response): Promise<void> => {
  const claims = req.classroom!;
  const transcript = TranscriptService.get(claims.roomId);
  if (!transcript || !isAIConfigured()) {
    res.json({ success: false, rollingSummary: TranscriptService.getSummary(claims.roomId) });
    return;
  }
  try {
    const summary = await requestAI(
      transcript.slice(-8000),
      undefined,
      'You are summarising a live meteorology training class from its running transcript. ' +
        'Write 3-5 concise bullet points of what has been covered so far. Do not invent anything not in the transcript.',
    );
    if (summary) TranscriptService.setSummary(claims.roomId, summary.trim());
    res.json({ success: true, rollingSummary: TranscriptService.getSummary(claims.roomId) });
  } catch (err: any) {
    console.warn(`[Summary] Failed to generate rolling summary: ${err?.message || err}`);
    res.json({ success: false, rollingSummary: TranscriptService.getSummary(claims.roomId) });
  }
});

/**
 * POST /api/transcript/:roomName/topic
 * Record a client-authored topic line into the running transcript.
 */
router.post('/transcript/:roomName/topic', requireClassroomToken, (req: ClassroomRequest, res: Response): void => {
  const claims = req.classroom!;
  const topic = typeof req.body?.topic === 'string' ? req.body.topic : req.body?.text;
  if (typeof topic === 'string' && topic.trim()) {
    TranscriptService.append(claims.roomId, undefined, `[Topic] ${topic.trim()}`, claims.batchId);
  }
  res.json({ success: true });
});

/**
 * POST /api/transcribe
 * Transcribe one live-class audio chunk (multipart `audio`) and append it to
 * the running transcript. Returns the recognised text. Requires a classroom
 * token so the utterance is attributed to the right room and speaker.
 */
router.post(
  '/transcribe',
  uploadAudio.single('audio'),
  requireClassroomToken,
  async (req: ClassroomRequest, res: Response): Promise<void> => {
    const claims = req.classroom!;
    // Live audio STT is opt-in: it fires many Gemini calls a minute and, on the
    // free tier (20 req/min), exhausts the quota so the Ask-AI doubt solver 429s.
    // Off by default keeps the whole quota for doubts + image OCR; set
    // LIVE_AUDIO_TRANSCRIPTION=true only on a key with real throughput.
    if (process.env.LIVE_AUDIO_TRANSCRIPTION !== 'true') {
      res.json({ text: '' });
      return;
    }
    const file = (req as ClassroomRequest & { file?: { buffer: Buffer; mimetype?: string } }).file;
    if (!file?.buffer?.length) {
      res.json({ text: '' });
      return;
    }
    try {
      const text = await transcribeAudio(file.buffer.toString('base64'), file.mimetype || 'audio/wav');
      if (text) TranscriptService.append(claims.roomId, claims.name, text, claims.batchId);
      res.json({ text });
    } catch (err: any) {
      console.warn(`[Transcribe] Failed to transcribe chunk: ${err?.message || err}`);
      res.json({ text: '' });
    }
  },
);

/**
 * POST /api/end-class
 * Accepts a classroom access token OR an LMS handoff JWT (teacher role required).
 * Deletes the LiveKit room, marks the backend LiveSession COMPLETED, and notifies the LMS.
 */
router.post('/end-class', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authorization token required' });
      return;
    }
    const token = authHeader.slice(7);

    let roomId: string | undefined;
    let batchId: string | null = null;
    let role: string | undefined;

    try {
      const claims = LiveClassroomService.verifyAccessToken(token);
      roomId = claims.roomId;
      batchId = claims.batchId;
      role = claims.role;
    } catch (accessErr) {
      if (accessErr instanceof AppError && accessErr.statusCode === 503) throw accessErr;
      try {
        const decoded = LiveClassroomService.verifyLmsHandoffToken(token);
        roomId = decoded.meetingId;
        batchId = decoded.batchId || null;
        role = decoded.role;
      } catch (lmsErr) {
        if (lmsErr instanceof AppError && lmsErr.statusCode === 503) throw lmsErr;
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
      }
    }

    if (role !== 'teacher') {
      res.status(403).json({ error: 'Only the teacher can end the class' });
      return;
    }
    if (!roomId) {
      res.status(400).json({ error: 'Token does not identify a room' });
      return;
    }

    batchId = batchId || req.body?.batchId || null;
    const hasNotes = !!req.body?.hasNotes;

    try {
      await roomServiceClient.deleteRoom(roomId);
    } catch (e: any) {
      // Room may already be gone — ignore.
      console.warn(`[End Class] Could not delete LiveKit room ${roomId}: ${e?.message || e}`);
    }

    try {
      await db.$queryRawUnsafe(
        'UPDATE "LiveSession" SET status = $1, "endedAt" = NOW(), "hasNotes" = $2 WHERE "roomId" = $3',
        'completed',
        hasNotes,
        roomId
      );
    } catch (e: any) {
      console.warn(`[End Class] Could not update LiveSession table: ${e?.message || e}`);
    }

    // Fire-and-forget: tell the LMS the class ended, then hand over the
    // transcript (which triggers minutes + a knowledge source on the LMS).
    LiveClassroomService.notifyLms('/api/live/end-class', roomId, batchId, { hasNotes });
    TranscriptService.flushAndNotify(roomId, batchId);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
