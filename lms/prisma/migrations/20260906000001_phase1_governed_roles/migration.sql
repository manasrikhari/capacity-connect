-- CreateEnum
CREATE TYPE "TrainerRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BatchStaffRole" AS ENUM ('AUTHOR', 'EXAMINER', 'EVALUATOR', 'MENTOR', 'OBSERVER');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "cadre" TEXT,
ADD COLUMN     "experience" JSONB,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "openToMentoring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publicSlug" TEXT;

-- AlterTable
ALTER TABLE "LibraryItem" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "TrainerRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organisation" TEXT,
    "designation" TEXT,
    "department" TEXT,
    "intent" TEXT,
    "status" "TrainerRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainerRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchStaff" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "BatchStaffRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatchStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "targetId" TEXT,
    "action" TEXT NOT NULL,
    "fromValue" TEXT,
    "toValue" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainerRequest_userId_key" ON "TrainerRequest"("userId");

-- CreateIndex
CREATE INDEX "TrainerRequest_status_idx" ON "TrainerRequest"("status");

-- CreateIndex
CREATE INDEX "BatchStaff_batchId_idx" ON "BatchStaff"("batchId");

-- CreateIndex
CREATE INDEX "BatchStaff_userId_idx" ON "BatchStaff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BatchStaff_batchId_userId_role_key" ON "BatchStaff"("batchId", "userId", "role");

-- CreateIndex
CREATE INDEX "AuditLog_targetId_idx" ON "AuditLog"("targetId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Batch_status_idx" ON "Batch"("status");

-- CreateIndex
CREATE INDEX "Batch_startDate_idx" ON "Batch"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_publicSlug_key" ON "Profile"("publicSlug");

-- CreateIndex
CREATE INDEX "LibraryItem_isPublic_idx" ON "LibraryItem"("isPublic");

-- AddForeignKey
ALTER TABLE "TrainerRequest" ADD CONSTRAINT "TrainerRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerRequest" ADD CONSTRAINT "TrainerRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchStaff" ADD CONSTRAINT "BatchStaff_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchStaff" ADD CONSTRAINT "BatchStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Phase 1.1 backfill: a STUDENT never needs account-level approval (approval lives
-- on the enrolment). Existing organic trainees were stuck PENDING → APPROVED.
UPDATE "User" SET "status" = 'APPROVED' WHERE "role" = 'STUDENT' AND "status" = 'PENDING';
