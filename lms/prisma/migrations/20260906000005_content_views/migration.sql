-- CreateTable
CREATE TABLE "ContentView" (
    "id" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentView_traineeId_idx" ON "ContentView"("traineeId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentView_traineeId_itemType_itemId_key" ON "ContentView"("traineeId", "itemType", "itemId");

-- AddForeignKey
ALTER TABLE "ContentView" ADD CONSTRAINT "ContentView_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

