-- Add the onboarded flag: distinguishes a brand-new user (who hasn't made
-- their /welcome choice yet) from a returning user who simply has zero
-- enrollments. Without this, both look identical to the root router.
ALTER TABLE "User" ADD COLUMN "onboarded" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: every user that already exists at the time this migration runs
-- has already been using the product (or was seeded as one) — mark them
-- onboarded so they are never sent to /welcome. Only users created after
-- this migration runs get the column's default of false.
UPDATE "User" SET "onboarded" = true;
