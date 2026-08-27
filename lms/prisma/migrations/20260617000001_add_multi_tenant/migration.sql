-- ═══════════════════════════════════════════════════════════════════════════
-- STEP A  New enum types, Batch table, nullable batchId columns everywhere
-- ═══════════════════════════════════════════════════════════════════════════

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE');

-- Extend Role — ADD VALUE is safe inside a transaction on PostgreSQL 12+
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';

-- CreateTable Batch
CREATE TABLE "Batch" (
    "id"        TEXT          NOT NULL,
    "name"      TEXT          NOT NULL,
    "grade"     TEXT,
    "teacherId" TEXT          NOT NULL,
    "status"    "BatchStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey Batch → User (teacher)
ALTER TABLE "Batch"
    ADD CONSTRAINT "Batch_teacherId_fkey"
    FOREIGN KEY ("teacherId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Batch_teacherId_idx" ON "Batch"("teacherId");

-- Add plan to User (NOT NULL with default — zero-effort backfill)
ALTER TABLE "User" ADD COLUMN "plan" "Plan" NOT NULL DEFAULT 'FREE';

-- Add batchId as NULLABLE on every affected table (backfill in Step B, locked in Step C)
ALTER TABLE "User"        ADD COLUMN "batchId" TEXT;
ALTER TABLE "Meeting"     ADD COLUMN "batchId" TEXT;
ALTER TABLE "Note"        ADD COLUMN "batchId" TEXT;
ALTER TABLE "Test"        ADD COLUMN "batchId" TEXT;
ALTER TABLE "Fee"         ADD COLUMN "batchId" TEXT;
ALTER TABLE "Payment"     ADD COLUMN "batchId" TEXT;
ALTER TABLE "TestAttempt" ADD COLUMN "batchId" TEXT;


-- ═══════════════════════════════════════════════════════════════════════════
-- STEP B  Backfill: create "Default Batch" owned by admin@lms.com,
--         then assign all existing rows to it
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    v_teacher_id TEXT;
    v_batch_id   TEXT := 'c_default_batch_0000001';
BEGIN
    SELECT id INTO v_teacher_id
    FROM "User"
    WHERE email = 'admin@lms.com'
    LIMIT 1;

    IF v_teacher_id IS NULL THEN
        RAISE EXCEPTION
            'Backfill aborted: admin@lms.com was not found. '
            'Ensure the seed user exists before running this migration.';
    END IF;

    INSERT INTO "Batch" ("id", "name", "grade", "teacherId", "status", "createdAt", "updatedAt")
    VALUES (v_batch_id, 'Default Batch', NULL, v_teacher_id, 'ACTIVE', NOW(), NOW());

    -- Students get the default batch
    UPDATE "User"        SET "batchId" = v_batch_id WHERE role = 'STUDENT';

    -- All existing content goes to the default batch
    UPDATE "Meeting"     SET "batchId" = v_batch_id;
    UPDATE "Note"        SET "batchId" = v_batch_id;
    UPDATE "Test"        SET "batchId" = v_batch_id;
    UPDATE "Fee"         SET "batchId" = v_batch_id;
    UPDATE "Payment"     SET "batchId" = v_batch_id;
    UPDATE "TestAttempt" SET "batchId" = v_batch_id;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- STEP C  Add FK constraints; make batchId NOT NULL on content tables
--         (User.batchId stays nullable — teachers / super-admins have no batch)
-- ═══════════════════════════════════════════════════════════════════════════

-- User.batchId — optional, SetNull when a batch is deleted
ALTER TABLE "User"
    ADD CONSTRAINT "User_batchId_fkey"
    FOREIGN KEY ("batchId") REFERENCES "Batch"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Meeting
ALTER TABLE "Meeting" ALTER COLUMN "batchId" SET NOT NULL;
ALTER TABLE "Meeting"
    ADD CONSTRAINT "Meeting_batchId_fkey"
    FOREIGN KEY ("batchId") REFERENCES "Batch"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Meeting_batchId_idx" ON "Meeting"("batchId");

-- Note
ALTER TABLE "Note" ALTER COLUMN "batchId" SET NOT NULL;
ALTER TABLE "Note"
    ADD CONSTRAINT "Note_batchId_fkey"
    FOREIGN KEY ("batchId") REFERENCES "Batch"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Note_batchId_idx" ON "Note"("batchId");

-- Test
ALTER TABLE "Test" ALTER COLUMN "batchId" SET NOT NULL;
ALTER TABLE "Test"
    ADD CONSTRAINT "Test_batchId_fkey"
    FOREIGN KEY ("batchId") REFERENCES "Batch"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Test_batchId_idx" ON "Test"("batchId");

-- Fee
ALTER TABLE "Fee" ALTER COLUMN "batchId" SET NOT NULL;
ALTER TABLE "Fee"
    ADD CONSTRAINT "Fee_batchId_fkey"
    FOREIGN KEY ("batchId") REFERENCES "Batch"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Fee_batchId_idx" ON "Fee"("batchId");

-- Payment
ALTER TABLE "Payment" ALTER COLUMN "batchId" SET NOT NULL;
ALTER TABLE "Payment"
    ADD CONSTRAINT "Payment_batchId_fkey"
    FOREIGN KEY ("batchId") REFERENCES "Batch"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Payment_batchId_idx" ON "Payment"("batchId");

-- TestAttempt
ALTER TABLE "TestAttempt" ALTER COLUMN "batchId" SET NOT NULL;
ALTER TABLE "TestAttempt"
    ADD CONSTRAINT "TestAttempt_batchId_fkey"
    FOREIGN KEY ("batchId") REFERENCES "Batch"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "TestAttempt_batchId_idx" ON "TestAttempt"("batchId");
