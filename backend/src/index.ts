import { createApp } from './app';
import { ENV } from './config/env';
import { db } from './config/db';

const app = createApp();

const server = app.listen(ENV.PORT, () => {
  console.log(`🚀 [Capacity Connect Backend] Server running on port ${ENV.PORT}`);
  console.log(`📡 [LiveKit Cloud URL] ${ENV.LIVEKIT_URL}`);
  console.log(`🌍 [Environment] ${ENV.NODE_ENV}`);
});

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 [${signal}] Received. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await db.$disconnect();
      console.log('📦 [Prisma DB] Disconnected.');
    } catch (e) {
      console.error('Error disconnecting Prisma', e);
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
