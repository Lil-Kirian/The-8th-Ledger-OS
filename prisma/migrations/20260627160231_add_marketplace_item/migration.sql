-- CreateTable
CREATE TABLE "marketplace_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT,
    "hallId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "quantitySold" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "marketplace_items_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "marketplace_items_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "marketplace_items_hallId_idx" ON "marketplace_items"("hallId");

-- CreateIndex
CREATE INDEX "marketplace_items_poolId_idx" ON "marketplace_items"("poolId");

-- CreateIndex
CREATE INDEX "marketplace_items_status_idx" ON "marketplace_items"("status");
