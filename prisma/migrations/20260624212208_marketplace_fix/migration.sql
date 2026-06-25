/*
  Warnings:

  - You are about to drop the `marketplace_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `marketplace_orders` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "marketplace_items_status_idx";

-- DropIndex
DROP INDEX "marketplace_items_hallId_idx";

-- DropIndex
DROP INDEX "marketplace_orders_status_idx";

-- DropIndex
DROP INDEX "marketplace_orders_buyerId_idx";

-- DropIndex
DROP INDEX "marketplace_orders_itemId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "marketplace_items";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "marketplace_orders";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_dynamic_valuations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hallId" TEXT NOT NULL,
    "assetBookValue" INTEGER NOT NULL DEFAULT 0,
    "accumulatedDividendsPerPercent" INTEGER NOT NULL DEFAULT 0,
    "ahgiPremium" INTEGER NOT NULL DEFAULT 0,
    "sriBonus" INTEGER NOT NULL DEFAULT 0,
    "pirDebtPerPercent" INTEGER NOT NULL DEFAULT 0,
    "ihcpDebtPerPercent" INTEGER NOT NULL DEFAULT 0,
    "valuePerPercent" REAL NOT NULL DEFAULT 0,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dynamic_valuations_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_dynamic_valuations" ("accumulatedDividendsPerPercent", "ahgiPremium", "assetBookValue", "calculatedAt", "hallId", "id", "pirDebtPerPercent", "sriBonus", "valuePerPercent") SELECT "accumulatedDividendsPerPercent", "ahgiPremium", "assetBookValue", "calculatedAt", "hallId", "id", "pirDebtPerPercent", "sriBonus", "valuePerPercent" FROM "dynamic_valuations";
DROP TABLE "dynamic_valuations";
ALTER TABLE "new_dynamic_valuations" RENAME TO "dynamic_valuations";
CREATE INDEX "dynamic_valuations_hallId_idx" ON "dynamic_valuations"("hallId");
CREATE INDEX "dynamic_valuations_calculatedAt_idx" ON "dynamic_valuations"("calculatedAt");
CREATE TABLE "new_inventory_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inventoryId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "escrowReleasedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "platformFee" INTEGER NOT NULL DEFAULT 0,
    "fulfillmentCost" INTEGER NOT NULL DEFAULT 0,
    "netToHall" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "inventory_orders_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "inventory_orders_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_inventory_orders" ("amount", "buyerId", "completedAt", "createdAt", "escrowReleasedAt", "id", "inventoryId", "quantity", "status") SELECT "amount", "buyerId", "completedAt", "createdAt", "escrowReleasedAt", "id", "inventoryId", "quantity", "status" FROM "inventory_orders";
DROP TABLE "inventory_orders";
ALTER TABLE "new_inventory_orders" RENAME TO "inventory_orders";
CREATE INDEX "inventory_orders_inventoryId_idx" ON "inventory_orders"("inventoryId");
CREATE INDEX "inventory_orders_buyerId_idx" ON "inventory_orders"("buyerId");
CREATE INDEX "inventory_orders_status_idx" ON "inventory_orders"("status");
CREATE TABLE "new_ownership_listings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownershipId" TEXT NOT NULL,
    "hallId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "percentListed" REAL NOT NULL,
    "pricePerPercent" REAL NOT NULL,
    "totalPrice" REAL NOT NULL,
    "floorPrice" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "listedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "soldAt" DATETIME,
    "buyerId" TEXT,
    "escrowStartedAt" DATETIME,
    "escrowExpiresAt" DATETIME,
    "auditHash" TEXT,
    "belowFloorApproved" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "interestCount" INTEGER NOT NULL DEFAULT 0,
    "isFractional" BOOLEAN NOT NULL DEFAULT false,
    "sellerKycTier" TEXT,
    CONSTRAINT "ownership_listings_ownershipId_fkey" FOREIGN KEY ("ownershipId") REFERENCES "ownerships" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ownership_listings_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ownership_listings_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ownership_listings_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ownership_listings" ("buyerId", "escrowStartedAt", "expiresAt", "floorPrice", "hallId", "id", "listedAt", "ownershipId", "percentListed", "pricePerPercent", "sellerId", "soldAt", "status", "totalPrice") SELECT "buyerId", "escrowStartedAt", "expiresAt", "floorPrice", "hallId", "id", "listedAt", "ownershipId", "percentListed", "pricePerPercent", "sellerId", "soldAt", "status", "totalPrice" FROM "ownership_listings";
DROP TABLE "ownership_listings";
ALTER TABLE "new_ownership_listings" RENAME TO "ownership_listings";
CREATE UNIQUE INDEX "ownership_listings_auditHash_key" ON "ownership_listings"("auditHash");
CREATE INDEX "ownership_listings_hallId_idx" ON "ownership_listings"("hallId");
CREATE INDEX "ownership_listings_sellerId_idx" ON "ownership_listings"("sellerId");
CREATE INDEX "ownership_listings_buyerId_idx" ON "ownership_listings"("buyerId");
CREATE INDEX "ownership_listings_status_idx" ON "ownership_listings"("status");
CREATE INDEX "ownership_listings_ownershipId_idx" ON "ownership_listings"("ownershipId");
CREATE TABLE "new_ownerships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hallId" TEXT,
    "amountCommitted" INTEGER NOT NULL,
    "ownershipPercent" REAL NOT NULL,
    "pacToken" TEXT,
    "totalReturned" INTEGER NOT NULL DEFAULT 0,
    "totalFromSale" INTEGER NOT NULL DEFAULT 0,
    "totalFromMarket" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "role" TEXT,
    "roleExpiresAt" DATETIME,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "inviteCodesRemaining" INTEGER NOT NULL DEFAULT 3,
    "inviteCodesUsed" INTEGER NOT NULL DEFAULT 0,
    "dynamicValue" REAL NOT NULL DEFAULT 0,
    "accumulatedDividends" INTEGER NOT NULL DEFAULT 0,
    "pirDebt" INTEGER NOT NULL DEFAULT 0,
    "ihcpDebt" INTEGER NOT NULL DEFAULT 0,
    "ledgerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ownerships_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ownerships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ownerships_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ownerships" ("accumulatedDividends", "amountCommitted", "createdAt", "dynamicValue", "hallId", "id", "inviteCodesRemaining", "inviteCodesUsed", "isWinner", "ledgerId", "ownershipPercent", "pacToken", "pirDebt", "poolId", "role", "roleExpiresAt", "status", "totalFromMarket", "totalFromSale", "totalReturned", "updatedAt", "userId") SELECT "accumulatedDividends", "amountCommitted", "createdAt", "dynamicValue", "hallId", "id", "inviteCodesRemaining", "inviteCodesUsed", "isWinner", "ledgerId", "ownershipPercent", "pacToken", "pirDebt", "poolId", "role", "roleExpiresAt", "status", "totalFromMarket", "totalFromSale", "totalReturned", "updatedAt", "userId" FROM "ownerships";
DROP TABLE "ownerships";
ALTER TABLE "new_ownerships" RENAME TO "ownerships";
CREATE UNIQUE INDEX "ownerships_pacToken_key" ON "ownerships"("pacToken");
CREATE INDEX "ownerships_pacToken_idx" ON "ownerships"("pacToken");
CREATE INDEX "ownerships_ledgerId_idx" ON "ownerships"("ledgerId");
CREATE UNIQUE INDEX "ownerships_poolId_userId_key" ON "ownerships"("poolId", "userId");
CREATE TABLE "new_social_shares" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refCode" TEXT NOT NULL,
    "platform" TEXT,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "commissionEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "social_shares_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "social_shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_social_shares" ("clicks", "commissionEarned", "conversions", "createdAt", "id", "itemId", "platform", "refCode", "userId") SELECT "clicks", "commissionEarned", "conversions", "createdAt", "id", "itemId", "platform", "refCode", "userId" FROM "social_shares";
DROP TABLE "social_shares";
ALTER TABLE "new_social_shares" RENAME TO "social_shares";
CREATE UNIQUE INDEX "social_shares_refCode_key" ON "social_shares"("refCode");
CREATE INDEX "social_shares_itemId_idx" ON "social_shares"("itemId");
CREATE INDEX "social_shares_userId_idx" ON "social_shares"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
