import express, { Express } from 'express';
import cors from 'cors';
import { globalApiLimiter } from './middleware/rateLimiters';
import { errorHandler } from './middleware/errorHandler';
import { ENV } from './config/env';

// Domain routers
import authRouter from './routes/auth';
import profileRouter from './routes/profile';
import competencyRouter from './routes/competency';
import certificatesRouter from './routes/certificates';
import feedbackRouter from './routes/feedback';
import announcementsRouter from './routes/announcements';
import analyticsRouter from './routes/analytics';
import livekitRouter from './routes/livekit';
import liveMeetingRouter from './routes/liveMeeting';

export const createApp = (): Express => {
  const app = express();

  // Rate Limiting
  app.use(globalApiLimiter);

  // CORS Configuration — enforced allowlist
  const allowedOrigins = new Set(
    [
      'http://localhost:3000',
      'http://localhost:3002',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3002',
      ENV.CLIENT_URL,
      ENV.LIVE_CLIENT_URL,
    ].filter(Boolean)
  );
  const opengrapesOriginPattern = /^https?:\/\/([a-z0-9-]+\.)*opengrapes\.com(:\d+)?$/i;

  app.use(
    cors({
      origin: (origin, callback) => {
        // No Origin header: server-to-server / curl / same-origin requests
        if (!origin) return callback(null, true);
        if (allowedOrigins.has(origin) || opengrapesOriginPattern.test(origin)) {
          return callback(null, true);
        }
        // Disallowed: omit CORS headers so browsers block the response
        return callback(null, false);
      },
      credentials: true,
    })
  );

  // JSON Body Parser with rawBody for LiveKit Webhook signatures
  app.use(
    express.json({
      limit: '15mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ limit: '15mb', extended: true }));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'healthy',
      platform: 'Capacity Connect (SIH 2026 - PS 26075)',
      timestamp: new Date().toISOString(),
    });
  });

  // Decoupled Domain API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/profile', profileRouter);
  app.use('/api/competency', competencyRouter);
  app.use('/api/certificates', certificatesRouter);
  app.use('/api/feedback', feedbackRouter);
  app.use('/api/announcements', announcementsRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/livekit', livekitRouter);
  app.use('/api', liveMeetingRouter);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
