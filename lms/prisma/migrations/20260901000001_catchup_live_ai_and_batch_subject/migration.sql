-- Catch-up migration: these objects were previously created ad hoc with
-- `prisma db push` and never captured as a migration, so fresh databases could
-- not be built from the migration history alone. Every statement is guarded to
-- be a no-op on databases where `db push` already created the objects.

-- AlterEnum
ALTER TYPE "ApprovalStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';

-- AlterTable Batch: subject column + leftover backfill defaults
ALTER TABLE "Batch" ADD COLUMN IF NOT EXISTS "subject" TEXT;
ALTER TABLE "Batch" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Batch" ALTER COLUMN "joinCode" DROP DEFAULT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "LiveSession" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'live',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "teacherJoined" BOOLEAN NOT NULL DEFAULT false,
    "hasNotes" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LiveSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Doubt" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "doubtText" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "screenshot" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Doubt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "MeetingMinutes" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingMinutes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AiConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AiMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "LiveSession_roomId_key" ON "LiveSession"("roomId");
CREATE UNIQUE INDEX IF NOT EXISTS "MeetingMinutes_sessionId_key" ON "MeetingMinutes"("sessionId");
CREATE INDEX IF NOT EXISTS "AiConversation_userId_idx" ON "AiConversation"("userId");
CREATE INDEX IF NOT EXISTS "AiConversation_batchId_idx" ON "AiConversation"("batchId");
CREATE INDEX IF NOT EXISTS "AiMessage_conversationId_idx" ON "AiMessage"("conversationId");

-- AddForeignKey (guarded: pg has no ADD CONSTRAINT IF NOT EXISTS)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LiveSession_batchId_fkey') THEN
        ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_batchId_fkey"
            FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Doubt_sessionId_fkey') THEN
        ALTER TABLE "Doubt" ADD CONSTRAINT "Doubt_sessionId_fkey"
            FOREIGN KEY ("sessionId") REFERENCES "LiveSession"("roomId") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Doubt_studentId_fkey') THEN
        ALTER TABLE "Doubt" ADD CONSTRAINT "Doubt_studentId_fkey"
            FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MeetingMinutes_sessionId_fkey') THEN
        ALTER TABLE "MeetingMinutes" ADD CONSTRAINT "MeetingMinutes_sessionId_fkey"
            FOREIGN KEY ("sessionId") REFERENCES "LiveSession"("roomId") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AiConversation_userId_fkey') THEN
        ALTER TABLE "AiConversation" ADD CONSTRAINT "AiConversation_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AiConversation_batchId_fkey') THEN
        ALTER TABLE "AiConversation" ADD CONSTRAINT "AiConversation_batchId_fkey"
            FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AiMessage_conversationId_fkey') THEN
        ALTER TABLE "AiMessage" ADD CONSTRAINT "AiMessage_conversationId_fkey"
            FOREIGN KEY ("conversationId") REFERENCES "AiConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
