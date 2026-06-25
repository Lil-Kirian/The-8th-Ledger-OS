/*
  Warnings:

  - You are about to drop the column `tacBase` on the `quantum_merit_scores` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ownership_listings" ADD COLUMN "escrowStartedAt" DATETIME;

-- AlterTable
ALTER TABLE "pools" ADD COLUMN "assetType" TEXT;
ALTER TABLE "pools" ADD COLUMN "ihcpTarget" INTEGER;
ALTER TABLE "pools" ADD COLUMN "revenueSources" TEXT;

-- AlterTable
ALTER TABLE "revenue_logs" ADD COLUMN "businessSource" TEXT;

-- AlterTable
ALTER TABLE "workers" ADD COLUMN "department" TEXT;
ALTER TABLE "workers" ADD COLUMN "shiftSchedule" TEXT;

-- CreateTable
CREATE TABLE "hall_contributions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hallId" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL,
    "repaidAmount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "hall_contributions_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hall_contributions_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users" ("ledgerId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_forge_ledgers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hallId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "totalPayroll" INTEGER NOT NULL,
    "workerCount" INTEGER NOT NULL,
    "entries" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "businessRevenue" INTEGER NOT NULL DEFAULT 0,
    "costOfGoodsSold" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "forge_ledgers_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_forge_ledgers" ("createdAt", "entries", "hallId", "id", "month", "totalPayroll", "workerCount") SELECT "createdAt", "entries", "hallId", "id", "month", "totalPayroll", "workerCount" FROM "forge_ledgers";
DROP TABLE "forge_ledgers";
ALTER TABLE "new_forge_ledgers" RENAME TO "forge_ledgers";
CREATE INDEX "forge_ledgers_hallId_idx" ON "forge_ledgers"("hallId");
CREATE UNIQUE INDEX "forge_ledgers_hallId_month_key" ON "forge_ledgers"("hallId", "month");
CREATE TABLE "new_halls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ghost',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "hallClass" TEXT,
    "sriScore" INTEGER NOT NULL DEFAULT 50,
    "ahgiScore" INTEGER NOT NULL DEFAULT 50,
    "closureStatus" TEXT NOT NULL DEFAULT 'active',
    "pirDebt" INTEGER NOT NULL DEFAULT 0,
    "payrollReserve" INTEGER NOT NULL DEFAULT 0,
    "assetType" TEXT,
    "businessStatus" TEXT NOT NULL DEFAULT 'operating',
    "inventoryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "forgeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ihcpBalance" INTEGER NOT NULL DEFAULT 0,
    "deedUrl" TEXT,
    "insuranceCertificateUrl" TEXT,
    "spvAgreementUrl" TEXT,
    "constitutionUrl" TEXT,
    CONSTRAINT "halls_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_halls" ("ahgiScore", "closureStatus", "constitutionUrl", "createdAt", "deedUrl", "hallClass", "id", "insuranceCertificateUrl", "name", "payrollReserve", "pirDebt", "poolId", "spvAgreementUrl", "sriScore", "status", "updatedAt") SELECT "ahgiScore", "closureStatus", "constitutionUrl", "createdAt", "deedUrl", "hallClass", "id", "insuranceCertificateUrl", "name", "payrollReserve", "pirDebt", "poolId", "spvAgreementUrl", "sriScore", "status", "updatedAt" FROM "halls";
DROP TABLE "halls";
ALTER TABLE "new_halls" RENAME TO "halls";
CREATE UNIQUE INDEX "halls_poolId_key" ON "halls"("poolId");
CREATE INDEX "halls_poolId_idx" ON "halls"("poolId");
CREATE TABLE "new_inventory_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hallId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "quantitySold" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "listedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "costOfGoods" INTEGER NOT NULL DEFAULT 0,
    "reorderThreshold" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "inventory_items_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_inventory_items" ("createdAt", "description", "hallId", "id", "listedAt", "price", "quantity", "quantitySold", "status", "title", "updatedAt") SELECT "createdAt", "description", "hallId", "id", "listedAt", "price", "quantity", "quantitySold", "status", "title", "updatedAt" FROM "inventory_items";
DROP TABLE "inventory_items";
ALTER TABLE "new_inventory_items" RENAME TO "inventory_items";
CREATE INDEX "inventory_items_hallId_idx" ON "inventory_items"("hallId");
CREATE INDEX "inventory_items_status_idx" ON "inventory_items"("status");
CREATE TABLE "new_quantum_merit_scores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ledgerId" TEXT NOT NULL,
    "ownershipBase" INTEGER NOT NULL DEFAULT 0,
    "poolHistoryScore" INTEGER NOT NULL DEFAULT 0,
    "communityScore" INTEGER NOT NULL DEFAULT 0,
    "reviewQualityScore" INTEGER NOT NULL DEFAULT 0,
    "identityScore" INTEGER NOT NULL DEFAULT 0,
    "arcStreakScore" INTEGER NOT NULL DEFAULT 0,
    "countryDiversityScore" INTEGER NOT NULL DEFAULT 0,
    "totalMeritScore" INTEGER NOT NULL DEFAULT 0,
    "lastPoolId" TEXT,
    "calculatedAt" DATETIME NOT NULL,
    CONSTRAINT "quantum_merit_scores_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users" ("ledgerId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_quantum_merit_scores" ("arcStreakScore", "calculatedAt", "communityScore", "countryDiversityScore", "id", "identityScore", "lastPoolId", "ledgerId", "poolHistoryScore", "reviewQualityScore", "totalMeritScore") SELECT "arcStreakScore", "calculatedAt", "communityScore", "countryDiversityScore", "id", "identityScore", "lastPoolId", "ledgerId", "poolHistoryScore", "reviewQualityScore", "totalMeritScore" FROM "quantum_merit_scores";
DROP TABLE "quantum_merit_scores";
ALTER TABLE "new_quantum_merit_scores" RENAME TO "quantum_merit_scores";
CREATE UNIQUE INDEX "quantum_merit_scores_ledgerId_key" ON "quantum_merit_scores"("ledgerId");
CREATE INDEX "quantum_merit_scores_ledgerId_idx" ON "quantum_merit_scores"("ledgerId");
CREATE INDEX "quantum_merit_scores_totalMeritScore_idx" ON "quantum_merit_scores"("totalMeritScore");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "hall_contributions_hallId_idx" ON "hall_contributions"("hallId");

-- CreateIndex
CREATE INDEX "hall_contributions_ledgerId_idx" ON "hall_contributions"("ledgerId");

-- CreateIndex
CREATE INDEX "hall_contributions_status_idx" ON "hall_contributions"("status");
