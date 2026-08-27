-- Step 0: Sync joinCode (already in DB from a previous manual migration,
-- but missing from the Prisma migration history — this is a no-op since the
-- column and index already exist).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Batch' AND column_name = 'joinCode'
  ) THEN
    ALTER TABLE "Batch" ADD COLUMN "joinCode" TEXT NOT NULL DEFAULT '';
    CREATE UNIQUE INDEX "Batch_joinCode_key" ON "Batch"("joinCode");
  END IF;
END $$;

-- Step 1: Create the Enrollment table.
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- Step 2: Backfill — copy every student's current batch + approval status
-- into an Enrollment row so no data is lost.
INSERT INTO "Enrollment" ("id", "studentId", "batchId", "status", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    u."id",
    u."batchId",
    u."status",
    u."createdAt",
    NOW()
FROM "User" u
WHERE u."role" = 'STUDENT'
  AND u."batchId" IS NOT NULL;

-- Step 3: Create indexes and unique constraint on Enrollment.
CREATE UNIQUE INDEX "Enrollment_studentId_batchId_key" ON "Enrollment"("studentId", "batchId");
CREATE INDEX "Enrollment_batchId_idx" ON "Enrollment"("batchId");
CREATE INDEX "Enrollment_studentId_idx" ON "Enrollment"("studentId");

-- Step 4: Add foreign keys on Enrollment.
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_batchId_fkey"
    FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 5: Drop the old single-batch column from User.
-- First drop the foreign key, then the index (if any), then the column.
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_batchId_fkey";
DROP INDEX IF EXISTS "User_batchId_idx";
ALTER TABLE "User" DROP COLUMN "batchId";

-- Step 6: Change Fee unique constraint from studentId-only to (studentId, batchId).
-- Drop the old unique index and create the composite one.
DROP INDEX "Fee_studentId_key";
CREATE UNIQUE INDEX "Fee_studentId_batchId_key" ON "Fee"("studentId", "batchId");
