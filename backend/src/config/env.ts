import dotenv from 'dotenv';
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
  LIVE_CLIENT_URL: getEnv('LIVE_CLIENT_URL', 'http://localhost:3001'),
  
  DATABASE_URL: getEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/capacity_connect?schema=public'),
  
  JWT_ACCESS_SECRET: getEnv('JWT_ACCESS_SECRET', 'dev-jwt-access-secret-key-change-me'),
  JWT_REFRESH_SECRET: getEnv('JWT_REFRESH_SECRET', 'dev-jwt-refresh-secret-key-change-me'),
  JWT_ACCESS_EXPIRY: getEnv('JWT_ACCESS_EXPIRY', '15m'),
  JWT_REFRESH_EXPIRY: getEnv('JWT_REFRESH_EXPIRY', '7d'),
  
  LIVEKIT_URL: getEnv('LIVEKIT_URL', 'wss://livekit.opengrapes.com'),
  LIVEKIT_API_KEY: getEnv('LIVEKIT_API_KEY', 'devkey'),
  LIVEKIT_API_SECRET: getEnv('LIVEKIT_API_SECRET', 'secret'),

  CERTIFICATE_SECRET: getEnv('CERTIFICATE_SECRET', 'sih2026-capacity-building-cert-secret-key'),
};
