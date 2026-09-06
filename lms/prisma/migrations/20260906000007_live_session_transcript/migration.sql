-- Phase 4: persist a class transcript so it can seed minutes and knowledge.
-- AlterTable
ALTER TABLE "LiveSession" ADD COLUMN     "transcript" TEXT;
