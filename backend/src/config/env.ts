import dotenv from 'dotenv';
import { AppError } from '../utils/appError';

dotenv.config();

function getEnv(key: string, defaultValue: string): string {
  const val = process.env[key];
  if (!val) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(`[CONFIG WARNING] Missing environment variable ${key}, using fallback.`);
    }
    return defaultValue;
  }
  return val;
}

export const ENV = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: getEnv('CLIENT_URL', 'http://localhost:3000'),
  LIVE_CLIENT_URL: getEnv('LIVE_CLIENT_URL', 'http://localhost:3002'),

  DATABASE_URL: getEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/capacity_connect?schema=public'),

  // Secrets intentionally have NO baked-in fallbacks. When one is missing,
  // requireSecret() fails the dependent request with a 503 config error.
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || '',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
  JWT_ACCESS_EXPIRY: getEnv('JWT_ACCESS_EXPIRY', '15m'),
  JWT_REFRESH_EXPIRY: getEnv('JWT_REFRESH_EXPIRY', '7d'),

  // Shared secret for LMS handoff JWTs and backend->LMS service JWTs.
  // LMS_JWT_SECRET is accepted as a legacy env var name.
  LIVE_OPENGRAPES_JWT_SECRET: process.env.LIVE_OPENGRAPES_JWT_SECRET || process.env.LMS_JWT_SECRET || '',

  // Base URL of the LMS app for server-to-server notifications.
  LMS_API_URL: getEnv('LMS_API_URL', 'http://localhost:3000'),

  LIVEKIT_URL: getEnv('LIVEKIT_URL', 'wss://livekit.opengrapes.com'),
  LIVEKIT_API_KEY: getEnv('LIVEKIT_API_KEY', 'devkey'),
  LIVEKIT_API_SECRET: getEnv('LIVEKIT_API_SECRET', 'secret'),

  // Metered TURN credentials. Optional: when unset, /api/turn serves STUN-only.
  METERED_API_KEY: process.env.METERED_API_KEY || '',
  METERED_APP_NAME: getEnv('METERED_APP_NAME', 'opengrapes'),

  CERTIFICATE_SECRET: process.env.CERTIFICATE_SECRET || '',
};

type SecretName =
  | 'JWT_ACCESS_SECRET'
  | 'JWT_REFRESH_SECRET'
  | 'LIVE_OPENGRAPES_JWT_SECRET'
  | 'CERTIFICATE_SECRET';

const missingSecretReported = new Set<string>();

/**
 * Returns the configured secret or throws a 503 AppError.
 * Logs a console.error once per missing secret — never silently
 * substitutes a baked-in value.
 */
export function requireSecret(name: SecretName): string {
  const value = ENV[name];
  if (!value) {
    if (!missingSecretReported.has(name)) {
      missingSecretReported.add(name);
      const hint =
        name === 'LIVE_OPENGRAPES_JWT_SECRET' ? ' (legacy env var name LMS_JWT_SECRET is also accepted)' : '';
      console.error(
        `[CONFIG ERROR] Required secret ${name} is not set${hint}. Requests depending on it will fail with 503.`
      );
    }
    throw new AppError(`Server configuration error: ${name} is not set`, 503);
  }
  return value;
}
