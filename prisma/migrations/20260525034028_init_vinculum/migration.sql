-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vinculumId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "phone" TEXT,
    "trustScore" INTEGER NOT NULL DEFAULT 100,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "vinBalance" INTEGER NOT NULL DEFAULT 0,
    "creditPool" INTEGER NOT NULL DEFAULT 0,
    "totalBurned" INTEGER NOT NULL DEFAULT 0,
    "forgesCompleted" INTEGER NOT NULL DEFAULT 0,
    "referrals" INTEGER NOT NULL DEFAULT 0,
    "referredBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "vinculumId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "pools" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT NOT NULL,
    "verticalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT,
    "assetValue" INTEGER NOT NULL,
    "committed" INTEGER NOT NULL DEFAULT 0,
    "target" INTEGER NOT NULL,
    "participants" INTEGER NOT NULL DEFAULT 0,
    "maxParticipants" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'filling',
    "country" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "winnerId" TEXT,
    "winnerCountry" TEXT,
    "surplusGenerated" INTEGER NOT NULL DEFAULT 0,
    "returnedToUsers" INTEGER NOT NULL DEFAULT 0,
    "founderSharePct" INTEGER NOT NULL DEFAULT 10,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closesAt" DATETIME NOT NULL,
    "distributedAt" DATETIME
);

-- CreateTable
CREATE TABLE "commitments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT NOT NULL,
    "vinculumId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "committedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returned" INTEGER,
    "surplusAllocated" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    CONSTRAINT "commitments_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools" ("poolId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "commitments_vinculumId_fkey" FOREIGN KEY ("vinculumId") REFERENCES "users" ("vinculumId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "side" TEXT NOT NULL,
    "vinculumId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "filled" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txHash" TEXT NOT NULL,
    CONSTRAINT "orders_vinculumId_fkey" FOREIGN KEY ("vinculumId") REFERENCES "users" ("vinculumId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "trades" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buyOrderId" TEXT NOT NULL,
    "sellOrderId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "total" REAL NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "executedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txHash" TEXT NOT NULL,
    CONSTRAINT "trades_buyOrderId_fkey" FOREIGN KEY ("buyOrderId") REFERENCES "orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "trades_sellOrderId_fkey" FOREIGN KEY ("sellOrderId") REFERENCES "orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "trades_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users" ("vinculumId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "trades_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users" ("vinculumId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "knot_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vinculumId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalCommitted" INTEGER NOT NULL DEFAULT 0,
    "poolsWon" INTEGER NOT NULL DEFAULT 0,
    "trustScore" INTEGER NOT NULL DEFAULT 100,
    "referrals" INTEGER NOT NULL DEFAULT 0,
    "depth" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'active',
    "referredBy" TEXT,
    CONSTRAINT "knot_members_vinculumId_fkey" FOREIGN KEY ("vinculumId") REFERENCES "users" ("vinculumId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT NOT NULL,
    "vinculumId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    "result" TEXT,
    "payout" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    CONSTRAINT "predictions_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools" ("poolId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "predictions_vinculumId_fkey" FOREIGN KEY ("vinculumId") REFERENCES "users" ("vinculumId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "referral_rewards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "toVinculumId" TEXT NOT NULL,
    "fromVinculumId" TEXT NOT NULL,
    "fromDisplayName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "rewardPercent" REAL NOT NULL,
    "rewardAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "referral_rewards_toVinculumId_fkey" FOREIGN KEY ("toVinculumId") REFERENCES "users" ("vinculumId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "referral_rewards_fromVinculumId_fkey" FOREIGN KEY ("fromVinculumId") REFERENCES "users" ("vinculumId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "treasury_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "poolId" TEXT,
    "vinculumId" TEXT,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "txHash" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "audited" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "treasury_transactions_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools" ("poolId") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "surplus_allocations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT NOT NULL,
    "poolName" TEXT NOT NULL,
    "totalCommitted" INTEGER NOT NULL,
    "assetValue" INTEGER NOT NULL,
    "surplusAmount" INTEGER NOT NULL,
    "returnedToUsers" INTEGER NOT NULL,
    "retainedByProtocol" INTEGER NOT NULL,
    "founderShare" INTEGER NOT NULL,
    "reinvestShare" INTEGER NOT NULL DEFAULT 0,
    "distributedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "winnerId" TEXT,
    CONSTRAINT "surplus_allocations_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools" ("poolId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "withdrawal_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vinculumId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "destination" TEXT NOT NULL,
    "destinationType" TEXT NOT NULL DEFAULT 'bank',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME,
    "processedBy" TEXT,
    "rejectionReason" TEXT,
    CONSTRAINT "withdrawal_requests_vinculumId_fkey" FOREIGN KEY ("vinculumId") REFERENCES "users" ("vinculumId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vin_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "vinculumId" TEXT,
    "reason" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previousSupply" INTEGER NOT NULL,
    "newSupply" INTEGER NOT NULL,
    CONSTRAINT "vin_records_vinculumId_fkey" FOREIGN KEY ("vinculumId") REFERENCES "users" ("vinculumId") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "activity_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vinculumId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "amount" INTEGER,
    "points" INTEGER,
    CONSTRAINT "activity_events_vinculumId_fkey" FOREIGN KEY ("vinculumId") REFERENCES "users" ("vinculumId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vinculumId" TEXT NOT NULL,
    "propertyName" TEXT NOT NULL,
    "verticalId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "helpful" INTEGER NOT NULL DEFAULT 0,
    "reported" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'visible',
    CONSTRAINT "reviews_vinculumId_fkey" FOREIGN KEY ("vinculumId") REFERENCES "users" ("vinculumId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tier_milestones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vinculumId" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trustScore" INTEGER NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    CONSTRAINT "tier_milestones_vinculumId_fkey" FOREIGN KEY ("vinculumId") REFERENCES "users" ("vinculumId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER,
    "txHash" TEXT NOT NULL,
    "vinculumId" TEXT,
    "poolId" TEXT,
    CONSTRAINT "audit_entries_vinculumId_fkey" FOREIGN KEY ("vinculumId") REFERENCES "users" ("vinculumId") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_entries_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "protocol_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "surplusReturnRate" INTEGER NOT NULL DEFAULT 50,
    "platformFee" INTEGER NOT NULL DEFAULT 0,
    "minCommitment" INTEGER NOT NULL DEFAULT 50,
    "maxCommitment" INTEGER NOT NULL DEFAULT 50000,
    "consensusThreshold" INTEGER NOT NULL DEFAULT 2,
    "vinBurnRate" INTEGER NOT NULL DEFAULT 5,
    "predictionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "publicAudit" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL,
    "updatedBy" TEXT
);

-- CreateTable
CREATE TABLE "invite_codes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "maxUses" INTEGER NOT NULL DEFAULT 50,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "users_vinculumId_key" ON "users"("vinculumId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_vinculumId_idx" ON "users"("vinculumId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tier_idx" ON "users"("tier");

-- CreateIndex
CREATE INDEX "users_trustScore_idx" ON "users"("trustScore");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_vinculumId_idx" ON "sessions"("vinculumId");

-- CreateIndex
CREATE UNIQUE INDEX "pools_poolId_key" ON "pools"("poolId");

-- CreateIndex
CREATE INDEX "pools_verticalId_idx" ON "pools"("verticalId");

-- CreateIndex
CREATE INDEX "pools_status_idx" ON "pools"("status");

-- CreateIndex
CREATE INDEX "pools_country_idx" ON "pools"("country");

-- CreateIndex
CREATE INDEX "pools_winnerId_idx" ON "pools"("winnerId");

-- CreateIndex
CREATE INDEX "pools_closesAt_idx" ON "pools"("closesAt");

-- CreateIndex
CREATE INDEX "commitments_poolId_idx" ON "commitments"("poolId");

-- CreateIndex
CREATE INDEX "commitments_vinculumId_idx" ON "commitments"("vinculumId");

-- CreateIndex
CREATE UNIQUE INDEX "commitments_poolId_vinculumId_key" ON "commitments"("poolId", "vinculumId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_txHash_key" ON "orders"("txHash");

-- CreateIndex
CREATE INDEX "orders_vinculumId_idx" ON "orders"("vinculumId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_side_idx" ON "orders"("side");

-- CreateIndex
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "trades_txHash_key" ON "trades"("txHash");

-- CreateIndex
CREATE INDEX "trades_buyerId_idx" ON "trades"("buyerId");

-- CreateIndex
CREATE INDEX "trades_sellerId_idx" ON "trades"("sellerId");

-- CreateIndex
CREATE INDEX "trades_executedAt_idx" ON "trades"("executedAt");

-- CreateIndex
CREATE UNIQUE INDEX "knot_members_vinculumId_key" ON "knot_members"("vinculumId");

-- CreateIndex
CREATE INDEX "knot_members_referredBy_idx" ON "knot_members"("referredBy");

-- CreateIndex
CREATE INDEX "knot_members_depth_idx" ON "knot_members"("depth");

-- CreateIndex
CREATE INDEX "predictions_poolId_idx" ON "predictions"("poolId");

-- CreateIndex
CREATE INDEX "predictions_vinculumId_idx" ON "predictions"("vinculumId");

-- CreateIndex
CREATE INDEX "predictions_country_idx" ON "predictions"("country");

-- CreateIndex
CREATE INDEX "referral_rewards_toVinculumId_idx" ON "referral_rewards"("toVinculumId");

-- CreateIndex
CREATE INDEX "referral_rewards_fromVinculumId_idx" ON "referral_rewards"("fromVinculumId");

-- CreateIndex
CREATE INDEX "referral_rewards_status_idx" ON "referral_rewards"("status");

-- CreateIndex
CREATE UNIQUE INDEX "treasury_transactions_txHash_key" ON "treasury_transactions"("txHash");

-- CreateIndex
CREATE INDEX "treasury_transactions_type_idx" ON "treasury_transactions"("type");

-- CreateIndex
CREATE INDEX "treasury_transactions_vinculumId_idx" ON "treasury_transactions"("vinculumId");

-- CreateIndex
CREATE INDEX "treasury_transactions_timestamp_idx" ON "treasury_transactions"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "surplus_allocations_poolId_key" ON "surplus_allocations"("poolId");

-- CreateIndex
CREATE INDEX "withdrawal_requests_vinculumId_idx" ON "withdrawal_requests"("vinculumId");

-- CreateIndex
CREATE INDEX "withdrawal_requests_status_idx" ON "withdrawal_requests"("status");

-- CreateIndex
CREATE INDEX "withdrawal_requests_requestedAt_idx" ON "withdrawal_requests"("requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "vin_records_txHash_key" ON "vin_records"("txHash");

-- CreateIndex
CREATE INDEX "vin_records_type_idx" ON "vin_records"("type");

-- CreateIndex
CREATE INDEX "vin_records_timestamp_idx" ON "vin_records"("timestamp");

-- CreateIndex
CREATE INDEX "activity_events_vinculumId_idx" ON "activity_events"("vinculumId");

-- CreateIndex
CREATE INDEX "activity_events_type_idx" ON "activity_events"("type");

-- CreateIndex
CREATE INDEX "activity_events_date_idx" ON "activity_events"("date");

-- CreateIndex
CREATE INDEX "reviews_vinculumId_idx" ON "reviews"("vinculumId");

-- CreateIndex
CREATE INDEX "reviews_verticalId_idx" ON "reviews"("verticalId");

-- CreateIndex
CREATE INDEX "reviews_status_idx" ON "reviews"("status");

-- CreateIndex
CREATE INDEX "tier_milestones_vinculumId_idx" ON "tier_milestones"("vinculumId");

-- CreateIndex
CREATE INDEX "tier_milestones_tier_idx" ON "tier_milestones"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "audit_entries_txHash_key" ON "audit_entries"("txHash");

-- CreateIndex
CREATE INDEX "audit_entries_type_idx" ON "audit_entries"("type");

-- CreateIndex
CREATE INDEX "audit_entries_timestamp_idx" ON "audit_entries"("timestamp");

-- CreateIndex
CREATE INDEX "audit_entries_txHash_idx" ON "audit_entries"("txHash");

-- CreateIndex
CREATE INDEX "audit_entries_poolId_idx" ON "audit_entries"("poolId");

-- CreateIndex
CREATE UNIQUE INDEX "protocol_settings_key_key" ON "protocol_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "invite_codes_code_key" ON "invite_codes"("code");

-- CreateIndex
CREATE INDEX "invite_codes_ownerId_idx" ON "invite_codes"("ownerId");

-- CreateIndex
CREATE INDEX "invite_codes_code_idx" ON "invite_codes"("code");
