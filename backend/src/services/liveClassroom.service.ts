import jwt from 'jsonwebtoken';
import { ENV, requireSecret } from '../config/env';
import { db } from '../config/db';
import { AppError } from '../utils/appError';

/**
 * Claims carried by classroom access AND refresh tokens so any later call
 * (doubts, end-class, LMS notifications) can attribute the user.
 */
export interface ClassroomClaims {
  userId: string; // backend User.id
  lmsUserId: string; // user id in the LMS database (from the handoff JWT)
  role: 'teacher' | 'student';
  roomId: string; // LiveKit room / LMS meeting id
  roomName: string; // duplicate of roomId, kept as an explicit claim
  batchId: string | null; // LMS batch id (NOT a backend Program id)
  name: string;
  email: string;
}

export type ClassroomTokenPayload = ClassroomClaims & { type: 'access' | 'refresh' };

const ACCESS_TOKEN_TTL = '4h';
const REFRESH_TOKEN_TTL = '7d';
const DEFAULT_PROGRAM_CODE = 'LIVE-CLASSROOM';

export class LiveClassroomService {
  /** Sign a matching access + refresh token pair carrying the full claims. */
  static issueTokenPair(claims: ClassroomClaims): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign({ ...claims, type: 'access' }, requireSecret('JWT_ACCESS_SECRET'), {
      expiresIn: ACCESS_TOKEN_TTL,
    });
    const refreshToken = jwt.sign({ ...claims, type: 'refresh' }, requireSecret('JWT_REFRESH_SECRET'), {
      expiresIn: REFRESH_TOKEN_TTL,
    });
    return { accessToken, refreshToken };
  }

  /** Verify a classroom access token. Throws AppError(401) on invalid tokens, AppError(503) on missing config. */
  static verifyAccessToken(token: string): ClassroomTokenPayload {
    const secret = requireSecret('JWT_ACCESS_SECRET');
    let decoded: ClassroomTokenPayload;
    try {
      decoded = jwt.verify(token, secret) as ClassroomTokenPayload;
    } catch {
      throw new AppError('Invalid or expired session token', 401);
    }
    if (decoded.type !== 'access') {
      throw new AppError('Invalid token type', 401);
    }
    return this.normalizeClaims(decoded);
  }

  /** Verify a classroom refresh token. Throws AppError(401) on invalid tokens, AppError(503) on missing config. */
  static verifyRefreshToken(token: string): ClassroomTokenPayload {
    const secret = requireSecret('JWT_REFRESH_SECRET');
    let decoded: ClassroomTokenPayload;
    try {
      decoded = jwt.verify(token, secret) as ClassroomTokenPayload;
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }
    if (decoded.type !== 'refresh') {
      throw new AppError('Invalid token type', 401);
    }
    return this.normalizeClaims(decoded);
  }

  /** Verify an LMS handoff JWT (signed by the LMS with the shared secret). */
  static verifyLmsHandoffToken(token: string): {
    userId?: string;
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    meetingId?: string;
    batchId?: string;
  } {
    const secret = requireSecret('LIVE_OPENGRAPES_JWT_SECRET');
    return jwt.verify(token, secret, { algorithms: ['HS256'], clockTolerance: 300 }) as any;
  }

  /** Rebuild clean claims from a decoded token (drops iat/exp, fills legacy gaps). */
  private static normalizeClaims<T extends ClassroomTokenPayload>(decoded: T): T {
    return {
      ...decoded,
      lmsUserId: decoded.lmsUserId || decoded.userId,
      roomName: decoded.roomName || decoded.roomId,
      batchId: decoded.batchId ?? null,
    };
  }

  /** Extract only the persistent claims (no type/iat/exp) for re-issuing tokens. */
  static toClaims(payload: ClassroomTokenPayload): ClassroomClaims {
    return {
      userId: payload.userId,
      lmsUserId: payload.lmsUserId || payload.userId,
      role: payload.role,
      roomId: payload.roomId,
      roomName: payload.roomName || payload.roomId,
      batchId: payload.batchId ?? null,
      name: payload.name,
      email: payload.email,
    };
  }

  /** HS256 service JWT for backend -> LMS calls, 5 minute expiry. */
  static signServiceJwt(roomId: string, batchId: string | null): string {
    return jwt.sign({ scope: 'live-service', roomId, batchId }, requireSecret('LIVE_OPENGRAPES_JWT_SECRET'), {
      algorithm: 'HS256',
      expiresIn: '5m',
    });
  }

  /**
   * Fire-and-forget POST to the LMS with a service JWT.
   * Logs and continues on any failure (including missing shared secret).
   */
  static notifyLms(path: string, roomId: string, batchId: string | null, body: Record<string, unknown>): void {
    let serviceJwt: string;
    try {
      serviceJwt = this.signServiceJwt(roomId, batchId);
    } catch (err: any) {
      console.warn(`[LMS Notify] Skipping ${path}: ${err?.message || err}`);
      return;
    }

    fetch(`${ENV.LMS_API_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceJwt}`,
      },
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok) {
          console.warn(`[LMS Notify] ${path} responded with HTTP ${res.status}`);
        }
      })
      .catch((err: any) => {
        console.warn(`[LMS Notify] Failed to reach LMS at ${path}: ${err?.message || err}`);
      });
  }

  /**
   * Upsert the default Program used for LMS-driven sessions (the LMS batchId
   * lives in a different database and is NOT a valid backend Program FK).
   */
  static async ensureDefaultProgram(createdById: string) {
    return db.program.upsert({
      where: { code: DEFAULT_PROGRAM_CODE },
      update: {},
      create: {
        code: DEFAULT_PROGRAM_CODE,
        title: 'Live Classroom',
        description: 'Auto-provisioned program for LMS-driven live classroom sessions.',
        department: 'Live Training',
        level: 'Intermediate',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'PUBLISHED',
        createdById,
      },
    });
  }

  /** Find the backend LiveSession for a room, creating it (and the default Program) when missing. */
  static async findOrCreateSession(roomId: string, createdById: string) {
    const existing = await db.liveSession.findUnique({ where: { roomId } });
    if (existing) return existing;

    const program = await this.ensureDefaultProgram(createdById);
    try {
      return await db.liveSession.create({
        data: {
          programId: program.id,
          roomId,
          title: `Live Session - ${roomId}`,
          status: 'LIVE',
          scheduledStart: new Date(),
          scheduledEnd: new Date(Date.now() + 2 * 60 * 60 * 1000),
          actualStart: new Date(),
        },
      });
    } catch (err: any) {
      // Unique collision when two participants join simultaneously
      if (err?.code === 'P2002') {
        const raced = await db.liveSession.findUnique({ where: { roomId } });
        if (raced) return raced;
      }
      throw err;
    }
  }
}
