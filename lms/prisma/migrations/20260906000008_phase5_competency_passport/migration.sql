-- Phase 5: competency passport & forecast-operations simulator.

-- CreateTable
CREATE TABLE "Competency" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetencyEvidence" (
    "id" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "score" INTEGER,
    "note" TEXT,
    "batchId" TEXT,
    "weatherCaseId" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetencyEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherCase" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hazard" TEXT,
    "region" TEXT,
    "imageUrl" TEXT,
    "correctColour" TEXT NOT NULL,
    "competencyCode" TEXT,
    "batchId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeatherCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherCaseAttempt" (
    "id" TEXT NOT NULL,
    "weatherCaseId" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "forecastColour" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeatherCaseAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Competency_code_key" ON "Competency"("code");

-- CreateIndex
CREATE INDEX "Competency_category_idx" ON "Competency"("category");

-- CreateIndex
CREATE INDEX "CompetencyEvidence_traineeId_competencyId_idx" ON "CompetencyEvidence"("traineeId", "competencyId");

-- CreateIndex
CREATE INDEX "CompetencyEvidence_competencyId_idx" ON "CompetencyEvidence"("competencyId");

-- CreateIndex
CREATE INDEX "WeatherCase_batchId_idx" ON "WeatherCase"("batchId");

-- CreateIndex
CREATE INDEX "WeatherCaseAttempt_traineeId_idx" ON "WeatherCaseAttempt"("traineeId");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherCaseAttempt_weatherCaseId_traineeId_key" ON "WeatherCaseAttempt"("weatherCaseId", "traineeId");

-- AddForeignKey
ALTER TABLE "CompetencyEvidence" ADD CONSTRAINT "CompetencyEvidence_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyEvidence" ADD CONSTRAINT "CompetencyEvidence_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyEvidence" ADD CONSTRAINT "CompetencyEvidence_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyEvidence" ADD CONSTRAINT "CompetencyEvidence_weatherCaseId_fkey" FOREIGN KEY ("weatherCaseId") REFERENCES "WeatherCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyEvidence" ADD CONSTRAINT "CompetencyEvidence_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherCase" ADD CONSTRAINT "WeatherCase_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherCase" ADD CONSTRAINT "WeatherCase_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherCaseAttempt" ADD CONSTRAINT "WeatherCaseAttempt_weatherCaseId_fkey" FOREIGN KEY ("weatherCaseId") REFERENCES "WeatherCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherCaseAttempt" ADD CONSTRAINT "WeatherCaseAttempt_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
