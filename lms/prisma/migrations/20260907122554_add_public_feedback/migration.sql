-- CreateTable
CREATE TABLE "PublicFeedback" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PublicFeedback_createdAt_idx" ON "PublicFeedback"("createdAt");
