/*
  Warnings:

  - You are about to drop the `commitments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `predictions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `surplus_allocations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vin_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `vinculumId` on the `activity_events` table. All the data in the column will be lost.
  - You are about to drop the column `vinculumId` on the `audit_entries` table. All the data in the column will be lost.
  - You are about to drop the column `vinculumId` on the `knot_members` table. All the data in the column will be lost.
  - You are about to drop the column `vinculumId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `founderSharePct` on the `pools` table. All the data in the column will be lost.
  - You are about to drop the column `returnedToUsers` on the `pools` table. All the data in the column will be lost.
  - You are about to drop the column `surplusGenerated` on the `pools` table. All the data in the column will be lost.
  - You are about to drop the column `winnerCountry` on the `pools` table. All the data in the column will be lost.
  - You are about to drop the column `winnerId` on the `pools` table. All the data in the column will be lost.
  - You are about to drop the column `predictionEnabled` on the `protocol_settings` table. All the data in the column will be lost.
  - You are about to drop the column `surplusReturnRate` on the `protocol_settings` table. All the data in the column will be lost.
  - You are about to drop the column `vinBurnRate` on the `protocol_settings` table. All the data in the column will be lost.
  - You are about to drop the column `fromVinculumId` on the `referral_rewards` table. All the data in the column will be lost.
  - You are about to drop the column `toVinculumId` on the `referral_rewards` table. All the data in the column will be lost.
  - You are about to drop the column `vinculumId` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `vinculumId` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `vinculumId` on the `tier_milestones` table. All the data in the column will be lost.
  - You are about to drop the column `vinculumId` on the `treasury_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `totalBurned` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `vinBalance` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `vinculumId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `vinculumId` on the `withdrawal_requests` table. All the data in the column will be lost.
  - Added the required column `ledgerId` to the `activity_events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ledgerId` to the `knot_members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ledgerId` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fromLedgerId` to the `referral_rewards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toLedgerId` to the `referral_rewards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ledgerId` to the `reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ledgerId` to the `sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ledgerId` to the `tier_milestones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ledgerId` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ledgerId` to the `withdrawal_requests` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "commitments_poolId_vinculumId_key";

-- DropIndex
DROP INDEX "commitments_vinculumId_idx";

-- DropIndex
DROP INDEX "commitments_poolId_idx";

-- DropIndex
DROP INDEX "predictions_country_idx";

-- DropIndex
DROP INDEX "predictions_vinculumId_idx";

-- DropIndex
DROP INDEX "predictions_poolId_idx";

-- DropIndex
DROP INDEX "surplus_allocations_poolId_key";

-- DropIndex
DROP INDEX "vin_records_timestamp_idx";

-- DropIndex
DROP INDEX "vin_records_type_idx";

-- DropIndex
DROP INDEX "vin_records_txHash_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "commitments";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "predictions";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "surplus_allocations";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "vin_records";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ledgerId" TEXT NOT NULL,
    "balance" REAL NOT NULL DEFAULT 0,
    "lockedBalance" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "wallets_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users" ("ledgerId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "deposits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "method" TEXT NOT NULL DEFAULT 'bank_transfer',
    "reference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "deposits_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "withdrawals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "destination" TEXT NOT NULL,
    "destinationType" TEXT NOT NULL DEFAULT 'bank',
    "reference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME,
    "processedBy" TEXT,
    "rejectionReason" TEXT,
    CONSTRAINT "withdrawals_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "poolId" TEXT,
    "ledgerId" TEXT,
    "amount" INTEGER,
    "metadata" TEXT,
    "txHash" TEXT NOT NULL,
    "visibleToPublic" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "audit_logs_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users" ("ledgerId") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pool_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "pool_reviews_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools" ("poolId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pool_reviews_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users" ("ledgerId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vertical_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "minCommitment" INTEGER NOT NULL DEFAULT 50,
    "maxCommitment" INTEGER NOT NULL DEFAULT 50000,
    "hallClass" TEXT NOT NULL DEFAULT 'I',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "user_identities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ledgerId" TEXT NOT NULL,
    "kycStatus" TEXT NOT NULL DEFAULT 'unverified',
    "verificationTier" INTEGER NOT NULL DEFAULT 0,
    "idDocumentUrl" TEXT,
    "selfieUrl" TEXT,
    "proofOfAddressUrl" TEXT,
    "verifiedAt" DATETIME,
    "verifiedBy" TEXT,
    "rejectionReason" TEXT,
    "identityScore" INTEGER NOT NULL DEFAULT 0,
    "countryVerified" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_identities_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users" ("ledgerId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quantum_merit_scores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ledgerId" TEXT NOT NULL,
    "tacBase" INTEGER NOT NULL DEFAULT 0,
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

-- CreateTable
CREATE TABLE "asset_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    "reviewedBy" TEXT,
    CONSTRAINT "asset_reports_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools" ("poolId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "asset_reports_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users" ("ledgerId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    CONSTRAINT "disputes_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools" ("poolId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "disputes_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users" ("ledgerId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ledgerId" TEXT NOT NULL,
    "poolId" TEXT,
    "proposalId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users" ("ledgerId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notifications_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "notifications_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "halls" (
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
    "deedUrl" TEXT,
    "insuranceCertificateUrl" TEXT,
    "spvAgreementUrl" TEXT,
    "constitutionUrl" TEXT,
    CONSTRAINT "halls_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hall_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hallId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "watermarkHash" TEXT NOT NULL,
    "isEphemeral" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hall_messages_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hall_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT NOT NULL,
    "hallId" TEXT,
    "proposerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER,
    "targetUserId" TEXT,
    "locationOption" TEXT,
    "voteWeightYes" REAL NOT NULL DEFAULT 0,
    "voteWeightNo" REAL NOT NULL DEFAULT 0,
    "voteCountYes" INTEGER NOT NULL DEFAULT 0,
    "voteCountNo" INTEGER NOT NULL DEFAULT 0,
    "thresholdPercent" REAL NOT NULL DEFAULT 51.00,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "executionStatus" TEXT DEFAULT 'pending',
    "executedAt" DATETIME,
    "executionResult" TEXT,
    "executionCost" INTEGER,
    "executionProof" TEXT,
    "executionNotes" TEXT,
    "stalledReason" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "passedAt" DATETIME,
    "executedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" DATETIME NOT NULL,
    CONSTRAINT "proposals_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "proposals_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "proposals_proposerId_fkey" FOREIGN KEY ("proposerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proposalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    "choice" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "votes_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ownerships" (
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
    "ledgerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ownerships_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ownerships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ownerships_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hall_treasuries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hallId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "totalDistributed" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" INTEGER NOT NULL DEFAULT 0,
    "lastDistribution" DATETIME,
    "payrollReserve" INTEGER NOT NULL DEFAULT 0,
    "pirDebt" INTEGER NOT NULL DEFAULT 0,
    "closureReserve" INTEGER NOT NULL DEFAULT 0,
    "monthlyRevenue" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "hall_treasuries_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hall_treasury_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "treasuryId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hall_treasury_transactions_treasuryId_fkey" FOREIGN KEY ("treasuryId") REFERENCES "hall_treasuries" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "revenue_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "ledgerFee" INTEGER NOT NULL,
    "communityNet" INTEGER NOT NULL,
    "distributed" BOOLEAN NOT NULL DEFAULT false,
    "distributionTx" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payrollDeducted" INTEGER NOT NULL DEFAULT 0,
    "netAfterPayroll" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "revenue_logs_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "spv_entities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entityType" TEXT NOT NULL DEFAULT 'llc',
    "jurisdiction" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "registeredAt" DATETIME,
    "bankAccount" TEXT,
    "taxId" TEXT,
    "documents" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "spv_entities_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "insurance_funds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'global',
    "balance" INTEGER NOT NULL DEFAULT 0,
    "totalContributed" INTEGER NOT NULL DEFAULT 0,
    "totalClaimsPaid" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "insurance_funds_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "insurance_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fundId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "approvedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "insurance_transactions_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "insurance_funds" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "marketplace_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT NOT NULL,
    "hallId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "images" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "quantitySold" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketplace_items_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "marketplace_items_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "social_shares" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refCode" TEXT NOT NULL,
    "platform" TEXT,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "commissionEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "social_shares_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "marketplace_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "social_shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "marketplace_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "communityShare" INTEGER NOT NULL,
    "marketerShare" INTEGER NOT NULL,
    "ledgerFee" INTEGER NOT NULL,
    "fulfillmentFee" INTEGER NOT NULL,
    "refCode" TEXT,
    "trackingNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "marketplace_orders_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "marketplace_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "marketplace_orders_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hall_invites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hallId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hall_invites_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hall_invites_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ban_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hallId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bannedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" TEXT,
    "duration" TEXT NOT NULL DEFAULT 'permanent',
    "expiresAt" DATETIME,
    "isAppealed" BOOLEAN NOT NULL DEFAULT false,
    "appealReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ban_records_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ban_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ban_records_bannedById_fkey" FOREIGN KEY ("bannedById") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hall_activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hallId" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hall_activities_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hall_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hall_roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hallId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "electedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "votesReceived" INTEGER NOT NULL DEFAULT 0,
    "isImpeached" BOOLEAN NOT NULL DEFAULT false,
    "impeachedAt" DATETIME,
    "impeachReason" TEXT,
    CONSTRAINT "hall_roles_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hall_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "kyc_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "idType" TEXT,
    "idNumber" TEXT,
    "idImageUrl" TEXT,
    "idVerified" BOOLEAN NOT NULL DEFAULT false,
    "selfieUrl" TEXT,
    "selfieMatchScore" REAL,
    "selfieVerified" BOOLEAN NOT NULL DEFAULT false,
    "livenessVideoUrl" TEXT,
    "livenessPassed" BOOLEAN NOT NULL DEFAULT false,
    "addressProofUrl" TEXT,
    "addressVerified" BOOLEAN NOT NULL DEFAULT false,
    "legalName" TEXT,
    "dateOfBirth" DATETIME,
    "address" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'visitor',
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "rejectionReason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "kyc_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dividend_distributions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT NOT NULL,
    "revenueLogId" TEXT,
    "totalAmount" INTEGER NOT NULL,
    "totalOwners" INTEGER NOT NULL,
    "distributedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "dividend_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "distributionId" TEXT NOT NULL,
    "ownershipId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" DATETIME,
    CONSTRAINT "dividend_entries_distributionId_fkey" FOREIGN KEY ("distributionId") REFERENCES "dividend_distributions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "dividend_entries_ownershipId_fkey" FOREIGN KEY ("ownershipId") REFERENCES "ownerships" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "location_options" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT NOT NULL,
    "hallId" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" REAL,
    "lng" REAL,
    "cost" INTEGER,
    "image" TEXT,
    "description" TEXT,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "voteWeight" REAL NOT NULL DEFAULT 0,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "location_options_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "location_options_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dormancy_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "poolId" TEXT,
    "hallId" TEXT,
    "type" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "notifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME
);

-- CreateTable
CREATE TABLE "execution_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proposalId" TEXT,
    "hallId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'passed',
    "cost" REAL,
    "proofUrls" TEXT,
    "executedBy" TEXT,
    "completedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "execution_logs_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "execution_logs_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "security_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ledgerId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "deviceFingerprint" TEXT,
    "lat" REAL,
    "lng" REAL,
    "success" BOOLEAN NOT NULL,
    "details" TEXT,
    "previousHash" TEXT,
    "currentHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "security_audit_logs_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users" ("ledgerId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "meridian_cycles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "continent" TEXT NOT NULL,
    "phase" TEXT NOT NULL DEFAULT 'hush',
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "lockStatus" TEXT NOT NULL DEFAULT 'unlocked',
    "winnerPoolId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "cycle_pools" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "voteWeight" REAL NOT NULL DEFAULT 0,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "revealedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cycle_pools_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "meridian_cycles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cycle_pools_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cycle_votes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "votedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cycle_votes_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "meridian_cycles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cycle_votes_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "cycle_pools" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "oracle_forecasts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "verticalOptions" TEXT NOT NULL,
    "countryOptions" TEXT NOT NULL,
    "lockDate" DATETIME NOT NULL,
    "resolveDate" DATETIME,
    "resolvedOutcome" TEXT,
    "periodStart" DATETIME,
    "periodEnd" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "oracle_predictions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "forecastId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vertical" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "oracle_predictions_forecastId_fkey" FOREIGN KEY ("forecastId") REFERENCES "oracle_forecasts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "oracle_predictions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "oracle_standings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "totalPredictions" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'novice',
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastCorrectAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "oracle_standings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "executive_cabinets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hallId" TEXT NOT NULL,
    "speakerId" TEXT,
    "treasurerId" TEXT,
    "wardenId" TEXT,
    "scribeId" TEXT,
    "electedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "isImpeached" BOOLEAN NOT NULL DEFAULT false,
    "impeachedAt" DATETIME,
    "impeachReason" TEXT,
    CONSTRAINT "executive_cabinets_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hallId" TEXT NOT NULL,
    "workerNumber" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "salary" INTEGER NOT NULL,
    "contractMonths" INTEGER NOT NULL,
    "hiredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    "performanceScore" REAL NOT NULL DEFAULT 0,
    "terminationReason" TEXT,
    "terminatedAt" DATETIME,
    CONSTRAINT "workers_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "worker_performances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workerId" TEXT NOT NULL,
    "reviewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metrics" TEXT,
    "score" REAL NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "improvementPlan" TEXT,
    "isTerminated" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "worker_performances_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "forge_ledgers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hallId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "totalPayroll" INTEGER NOT NULL,
    "workerCount" INTEGER NOT NULL,
    "entries" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "forge_ledgers_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "relay_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hallId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "relayedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'relayed',
    "loggedBy" TEXT NOT NULL,
    CONSTRAINT "relay_messages_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "relay_messages_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sri_snapshots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hallId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 50,
    "governanceActivity" INTEGER NOT NULL DEFAULT 0,
    "revenueConsistency" INTEGER NOT NULL DEFAULT 0,
    "dividendReliability" INTEGER NOT NULL DEFAULT 0,
    "proposalQuality" INTEGER NOT NULL DEFAULT 0,
    "dormancyRate" INTEGER NOT NULL DEFAULT 0,
    "marketplaceVelocity" INTEGER NOT NULL DEFAULT 0,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sri_snapshots_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ahgi_snapshots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hallId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 50,
    "healthMetrics" TEXT,
    "growthMetrics" TEXT,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ahgi_snapshots_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dynamic_valuations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hallId" TEXT NOT NULL,
    "assetBookValue" INTEGER NOT NULL DEFAULT 0,
    "accumulatedDividendsPerPercent" INTEGER NOT NULL DEFAULT 0,
    "ahgiPremium" INTEGER NOT NULL DEFAULT 0,
    "sriBonus" INTEGER NOT NULL DEFAULT 0,
    "pirDebtPerPercent" INTEGER NOT NULL DEFAULT 0,
    "valuePerPercent" REAL NOT NULL DEFAULT 0,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dynamic_valuations_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pir_allocations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hallId" TEXT NOT NULL,
    "pillar" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL,
    "spent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "pir_allocations_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pir_advances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hallId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "repaymentRate" REAL NOT NULL DEFAULT 0,
    "repaidAmount" INTEGER NOT NULL DEFAULT 0,
    "interestRate" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "approvedBy" TEXT NOT NULL,
    "approvedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    CONSTRAINT "pir_advances_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "closure_protocols" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hallId" TEXT NOT NULL,
    "triggerMonth" DATETIME NOT NULL,
    "ahgiAtTrigger" INTEGER NOT NULL,
    "revenueAtTrigger" INTEGER NOT NULL,
    "payrollAtTrigger" INTEGER NOT NULL,
    "phase" TEXT NOT NULL DEFAULT 'warning',
    "liquidationValue" INTEGER,
    "assetSalePrice" INTEGER,
    "pirDebtPaid" INTEGER NOT NULL DEFAULT 0,
    "taxPaid" INTEGER NOT NULL DEFAULT 0,
    "severancePaid" INTEGER NOT NULL DEFAULT 0,
    "ledgerFeePaid" INTEGER NOT NULL DEFAULT 0,
    "netProceeds" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "closure_protocols_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "liquidation_payouts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "closureId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ownershipPercent" REAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "liquidation_payouts_closureId_fkey" FOREIGN KEY ("closureId") REFERENCES "closure_protocols" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "liquidation_payouts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dormancy_vaults" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ownershipId" TEXT NOT NULL,
    "vaultedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accumulatedDividends" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'vaulted',
    "reclaimedAt" DATETIME,
    CONSTRAINT "dormancy_vaults_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "dormancy_vaults_ownershipId_fkey" FOREIGN KEY ("ownershipId") REFERENCES "ownerships" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dormancy_auctions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vaultId" TEXT NOT NULL,
    "listedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startingPrice" INTEGER NOT NULL,
    "finalPrice" INTEGER,
    "buyerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "completedAt" DATETIME,
    CONSTRAINT "dormancy_auctions_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "dormancy_vaults" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "dormancy_auctions_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agora_suggestions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "continent" TEXT NOT NULL,
    "vertical" TEXT NOT NULL,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "agora_suggestions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agora_suggestion_votes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "suggestionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "agora_suggestion_votes_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "agora_suggestions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "agora_suggestion_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agora_qas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "answeredBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" DATETIME,
    CONSTRAINT "agora_qas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "eighth_ledger_updates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hallId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "amount" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "eighth_ledger_updates_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sovereign_stream_posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hallId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "proposalId" TEXT,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sovereign_stream_posts_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sovereign_stream_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sovereign_stream_posts_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sovereign_stream_posts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "sovereign_stream_posts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inventory_items" (
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
    CONSTRAINT "inventory_items_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inventory_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inventoryId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "escrowReleasedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "inventory_orders_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "inventory_orders_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ownership_listings" (
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
    CONSTRAINT "ownership_listings_ownershipId_fkey" FOREIGN KEY ("ownershipId") REFERENCES "ownerships" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ownership_listings_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ownership_listings_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ownership_listings_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_activity_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ledgerId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "description" TEXT,
    "metadata" TEXT,
    "amount" INTEGER,
    "points" INTEGER,
    CONSTRAINT "activity_events_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users" ("ledgerId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_activity_events" ("amount", "date", "detail", "id", "points", "title", "type") SELECT "amount", "date", "detail", "id", "points", "title", "type" FROM "activity_events";
DROP TABLE "activity_events";
ALTER TABLE "new_activity_events" RENAME TO "activity_events";
CREATE INDEX "activity_events_ledgerId_idx" ON "activity_events"("ledgerId");
CREATE INDEX "activity_events_type_idx" ON "activity_events"("type");
CREATE INDEX "activity_events_date_idx" ON "activity_events"("date");
CREATE TABLE "new_audit_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER,
    "txHash" TEXT NOT NULL,
    "previousHash" TEXT,
    "ledgerId" TEXT,
    "poolId" TEXT,
    CONSTRAINT "audit_entries_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users" ("ledgerId") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_entries_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_audit_entries" ("amount", "description", "id", "poolId", "timestamp", "txHash", "type") SELECT "amount", "description", "id", "poolId", "timestamp", "txHash", "type" FROM "audit_entries";
DROP TABLE "audit_entries";
ALTER TABLE "new_audit_entries" RENAME TO "audit_entries";
CREATE UNIQUE INDEX "audit_entries_txHash_key" ON "audit_entries"("txHash");
CREATE INDEX "audit_entries_type_idx" ON "audit_entries"("type");
CREATE INDEX "audit_entries_timestamp_idx" ON "audit_entries"("timestamp");
CREATE INDEX "audit_entries_txHash_idx" ON "audit_entries"("txHash");
CREATE INDEX "audit_entries_poolId_idx" ON "audit_entries"("poolId");
CREATE INDEX "audit_entries_previousHash_idx" ON "audit_entries"("previousHash");
CREATE TABLE "new_knot_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ledgerId" TEXT NOT NULL,
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
    CONSTRAINT "knot_members_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users" ("ledgerId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_knot_members" ("country", "depth", "displayName", "id", "joinedAt", "poolsWon", "referrals", "referredBy", "status", "tier", "totalCommitted", "trustScore") SELECT "country", "depth", "displayName", "id", "joinedAt", "poolsWon", "referrals", "referredBy", "status", "tier", "totalCommitted", "trustScore" FROM "knot_members";
DROP TABLE "knot_members";
ALTER TABLE "new_knot_members" RENAME TO "knot_members";
CREATE UNIQUE INDEX "knot_members_ledgerId_key" ON "knot_members"("ledgerId");
CREATE INDEX "knot_members_referredBy_idx" ON "knot_members"("referredBy");
CREATE INDEX "knot_members_depth_idx" ON "knot_members"("depth");
CREATE TABLE "new_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "side" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "filled" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txHash" TEXT NOT NULL,
    CONSTRAINT "orders_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users" ("ledgerId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_orders" ("amount", "createdAt", "filled", "id", "price", "side", "status", "txHash") SELECT "amount", "createdAt", "filled", "id", "price", "side", "status", "txHash" FROM "orders";
DROP TABLE "orders";
ALTER TABLE "new_orders" RENAME TO "orders";
CREATE UNIQUE INDEX "orders_txHash_key" ON "orders"("txHash");
CREATE INDEX "orders_ledgerId_idx" ON "orders"("ledgerId");
CREATE INDEX "orders_status_idx" ON "orders"("status");
CREATE INDEX "orders_side_idx" ON "orders"("side");
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");
CREATE TABLE "new_pools" (
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
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "reportedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closesAt" DATETIME NOT NULL,
    "distributedAt" DATETIME,
    "trueCost" INTEGER,
    "listedPrice" INTEGER,
    "managementFee" REAL NOT NULL DEFAULT 20.00,
    "minCommitment" INTEGER NOT NULL DEFAULT 1,
    "maxCommitment" INTEGER,
    "campaignDuration" INTEGER NOT NULL DEFAULT 30,
    "emojiSet" TEXT NOT NULL DEFAULT '🏠🚗📱🎓🏥🏗️✈️🌾⚡',
    "hallUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "selectedLocation" TEXT,
    "externalLinks" TEXT,
    "assetImages" TEXT,
    "assetVideos" TEXT,
    "tour360Url" TEXT,
    "documents" TEXT,
    "assetCondition" TEXT NOT NULL DEFAULT 'new',
    "hallClass" TEXT,
    "pirAllocation" TEXT,
    "assetBookValue" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_pools" ("assetValue", "closesAt", "committed", "country", "createdAt", "creatorId", "description", "distributedAt", "id", "imageUrl", "maxParticipants", "name", "participants", "poolId", "status", "target", "verticalId") SELECT "assetValue", "closesAt", "committed", "country", "createdAt", "creatorId", "description", "distributedAt", "id", "imageUrl", "maxParticipants", "name", "participants", "poolId", "status", "target", "verticalId" FROM "pools";
DROP TABLE "pools";
ALTER TABLE "new_pools" RENAME TO "pools";
CREATE UNIQUE INDEX "pools_poolId_key" ON "pools"("poolId");
CREATE INDEX "pools_verticalId_idx" ON "pools"("verticalId");
CREATE INDEX "pools_status_idx" ON "pools"("status");
CREATE INDEX "pools_country_idx" ON "pools"("country");
CREATE INDEX "pools_closesAt_idx" ON "pools"("closesAt");
CREATE INDEX "pools_isVerified_idx" ON "pools"("isVerified");
CREATE TABLE "new_protocol_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "platformFee" INTEGER NOT NULL DEFAULT 0,
    "minCommitment" INTEGER NOT NULL DEFAULT 50,
    "maxCommitment" INTEGER NOT NULL DEFAULT 50000,
    "consensusThreshold" INTEGER NOT NULL DEFAULT 2,
    "publicAudit" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL,
    "updatedBy" TEXT,
    "pirEnabled" BOOLEAN NOT NULL DEFAULT true,
    "oracleEnabled" BOOLEAN NOT NULL DEFAULT true,
    "meridianCycleEnabled" BOOLEAN NOT NULL DEFAULT true,
    "closureProtocolEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dormancyProtocolEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dynamicValuationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "forgeLedgerEnabled" BOOLEAN NOT NULL DEFAULT true,
    "eighthLedgerTithe" INTEGER NOT NULL DEFAULT 20
);
INSERT INTO "new_protocol_settings" ("consensusThreshold", "id", "key", "maxCommitment", "minCommitment", "platformFee", "publicAudit", "updatedAt", "updatedBy") SELECT "consensusThreshold", "id", "key", "maxCommitment", "minCommitment", "platformFee", "publicAudit", "updatedAt", "updatedBy" FROM "protocol_settings";
DROP TABLE "protocol_settings";
ALTER TABLE "new_protocol_settings" RENAME TO "protocol_settings";
CREATE UNIQUE INDEX "protocol_settings_key_key" ON "protocol_settings"("key");
CREATE TABLE "new_referral_rewards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "toLedgerId" TEXT NOT NULL,
    "fromLedgerId" TEXT NOT NULL,
    "fromDisplayName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "rewardPercent" REAL NOT NULL,
    "rewardAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "referral_rewards_toLedgerId_fkey" FOREIGN KEY ("toLedgerId") REFERENCES "users" ("ledgerId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "referral_rewards_fromLedgerId_fkey" FOREIGN KEY ("fromLedgerId") REFERENCES "users" ("ledgerId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_referral_rewards" ("amount", "createdAt", "fromDisplayName", "id", "rewardAmount", "rewardPercent", "status", "type") SELECT "amount", "createdAt", "fromDisplayName", "id", "rewardAmount", "rewardPercent", "status", "type" FROM "referral_rewards";
DROP TABLE "referral_rewards";
ALTER TABLE "new_referral_rewards" RENAME TO "referral_rewards";
CREATE INDEX "referral_rewards_toLedgerId_idx" ON "referral_rewards"("toLedgerId");
CREATE INDEX "referral_rewards_fromLedgerId_idx" ON "referral_rewards"("fromLedgerId");
CREATE INDEX "referral_rewards_status_idx" ON "referral_rewards"("status");
CREATE TABLE "new_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ledgerId" TEXT NOT NULL,
    "propertyName" TEXT NOT NULL,
    "verticalId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "helpful" INTEGER NOT NULL DEFAULT 0,
    "reported" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'visible',
    CONSTRAINT "reviews_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users" ("ledgerId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_reviews" ("date", "helpful", "id", "propertyName", "rating", "reported", "status", "text", "verticalId") SELECT "date", "helpful", "id", "propertyName", "rating", "reported", "status", "text", "verticalId" FROM "reviews";
DROP TABLE "reviews";
ALTER TABLE "new_reviews" RENAME TO "reviews";
CREATE INDEX "reviews_ledgerId_idx" ON "reviews"("ledgerId");
CREATE INDEX "reviews_verticalId_idx" ON "reviews"("verticalId");
CREATE INDEX "reviews_status_idx" ON "reviews"("status");
CREATE TABLE "new_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceFingerprint" TEXT,
    "geoCountry" TEXT,
    "geoCity" TEXT,
    "lastUsedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotationCount" INTEGER NOT NULL DEFAULT 0,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "anomalyFlags" TEXT,
    CONSTRAINT "sessions_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users" ("ledgerId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_sessions" ("anomalyFlags", "createdAt", "deviceFingerprint", "expiresAt", "geoCity", "geoCountry", "id", "ipAddress", "isRevoked", "lastUsedAt", "rotationCount", "token", "userAgent") SELECT "anomalyFlags", "createdAt", "deviceFingerprint", "expiresAt", "geoCity", "geoCountry", "id", "ipAddress", "isRevoked", "lastUsedAt", "rotationCount", "token", "userAgent" FROM "sessions";
DROP TABLE "sessions";
ALTER TABLE "new_sessions" RENAME TO "sessions";
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");
CREATE INDEX "sessions_token_idx" ON "sessions"("token");
CREATE INDEX "sessions_ledgerId_idx" ON "sessions"("ledgerId");
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");
CREATE INDEX "sessions_isRevoked_idx" ON "sessions"("isRevoked");
CREATE TABLE "new_tier_milestones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ledgerId" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trustScore" INTEGER NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    CONSTRAINT "tier_milestones_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users" ("ledgerId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_tier_milestones" ("date", "id", "name", "tier", "triggeredBy", "trustScore") SELECT "date", "id", "name", "tier", "triggeredBy", "trustScore" FROM "tier_milestones";
DROP TABLE "tier_milestones";
ALTER TABLE "new_tier_milestones" RENAME TO "tier_milestones";
CREATE INDEX "tier_milestones_ledgerId_idx" ON "tier_milestones"("ledgerId");
CREATE INDEX "tier_milestones_tier_idx" ON "tier_milestones"("tier");
CREATE TABLE "new_trades" (
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
    CONSTRAINT "trades_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users" ("ledgerId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "trades_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users" ("ledgerId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_trades" ("amount", "buyOrderId", "buyerId", "executedAt", "id", "price", "sellOrderId", "sellerId", "total", "txHash") SELECT "amount", "buyOrderId", "buyerId", "executedAt", "id", "price", "sellOrderId", "sellerId", "total", "txHash" FROM "trades";
DROP TABLE "trades";
ALTER TABLE "new_trades" RENAME TO "trades";
CREATE UNIQUE INDEX "trades_txHash_key" ON "trades"("txHash");
CREATE INDEX "trades_buyerId_idx" ON "trades"("buyerId");
CREATE INDEX "trades_sellerId_idx" ON "trades"("sellerId");
CREATE INDEX "trades_executedAt_idx" ON "trades"("executedAt");
CREATE TABLE "new_treasury_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "poolId" TEXT,
    "ledgerId" TEXT,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "txHash" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "audited" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "treasury_transactions_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools" ("poolId") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_treasury_transactions" ("amount", "audited", "currency", "description", "id", "poolId", "status", "timestamp", "txHash", "type") SELECT "amount", "audited", "currency", "description", "id", "poolId", "status", "timestamp", "txHash", "type" FROM "treasury_transactions";
DROP TABLE "treasury_transactions";
ALTER TABLE "new_treasury_transactions" RENAME TO "treasury_transactions";
CREATE UNIQUE INDEX "treasury_transactions_txHash_key" ON "treasury_transactions"("txHash");
CREATE INDEX "treasury_transactions_type_idx" ON "treasury_transactions"("type");
CREATE INDEX "treasury_transactions_ledgerId_idx" ON "treasury_transactions"("ledgerId");
CREATE INDEX "treasury_transactions_timestamp_idx" ON "treasury_transactions"("timestamp");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ledgerId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "phone" TEXT,
    "trustScore" INTEGER NOT NULL DEFAULT 100,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "ledgerBalance" INTEGER NOT NULL DEFAULT 0,
    "creditPool" INTEGER NOT NULL DEFAULT 0,
    "forgesCompleted" INTEGER NOT NULL DEFAULT 0,
    "referrals" INTEGER NOT NULL DEFAULT 0,
    "referredBy" TEXT,
    "lastLoginAt" DATETIME,
    "lastLoginIP" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "totpSecret" TEXT,
    "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "totpVerified" BOOLEAN NOT NULL DEFAULT false,
    "recoveryCodes" TEXT,
    "bio" TEXT,
    "preferences" TEXT,
    "avatar" TEXT,
    "totalCommitted" INTEGER NOT NULL DEFAULT 0,
    "reportsSubmitted" INTEGER NOT NULL DEFAULT 0,
    "identityScore" INTEGER NOT NULL DEFAULT 0,
    "kycStatus" TEXT NOT NULL DEFAULT 'unverified',
    "kycVerifiedAt" DATETIME,
    "role" TEXT NOT NULL DEFAULT 'user',
    "isPrimaryAdmin" BOOLEAN NOT NULL DEFAULT false,
    "legalName" TEXT,
    "idNumber" TEXT,
    "idDocumentUrl" TEXT,
    "addressProofUrl" TEXT,
    "selfieUrl" TEXT,
    "livenessVerified" BOOLEAN NOT NULL DEFAULT false,
    "kycTier" TEXT NOT NULL DEFAULT 'visitor',
    "lastActivityAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceFingerprint" TEXT,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" TEXT,
    "beneficiaryName" TEXT,
    "beneficiaryEmail" TEXT,
    "adminTotpSecret" TEXT,
    "adminTotpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "adminPinHash" TEXT,
    "adminPinAttempts" INTEGER NOT NULL DEFAULT 0,
    "adminLockedUntil" DATETIME,
    "lastAdminAccessAt" DATETIME,
    "lastAdminIP" TEXT,
    "adminAccessCount" INTEGER NOT NULL DEFAULT 0,
    "founderTotpSecret" TEXT,
    "founderTotpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "founderPinHash" TEXT,
    "webauthnCredentialId" TEXT,
    "webauthnPublicKey" TEXT,
    "webauthnCounter" INTEGER NOT NULL DEFAULT 0,
    "lastFounderAccessAt" DATETIME,
    "lastFounderIP" TEXT,
    "founderAccessCount" INTEGER NOT NULL DEFAULT 0,
    "founderPinAttempts" INTEGER NOT NULL DEFAULT 0,
    "founderLockedUntil" DATETIME,
    "founderAccessWindowStart" INTEGER,
    "founderAccessWindowEnd" INTEGER,
    "founderTrustedLat" REAL,
    "founderTrustedLng" REAL,
    "founderGeoRadiusKm" INTEGER NOT NULL DEFAULT 50,
    "globalSriScore" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_users" ("country", "createdAt", "creditPool", "displayName", "email", "forgesCompleted", "id", "lastLoginAt", "lastLoginIP", "passwordHash", "phone", "referrals", "referredBy", "tier", "trustScore", "updatedAt") SELECT "country", "createdAt", "creditPool", "displayName", "email", "forgesCompleted", "id", "lastLoginAt", "lastLoginIP", "passwordHash", "phone", "referrals", "referredBy", "tier", "trustScore", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_ledgerId_key" ON "users"("ledgerId");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_ledgerId_idx" ON "users"("ledgerId");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_tier_idx" ON "users"("tier");
CREATE INDEX "users_trustScore_idx" ON "users"("trustScore");
CREATE INDEX "users_kycStatus_idx" ON "users"("kycStatus");
CREATE TABLE "new_withdrawal_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ledgerId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "destination" TEXT NOT NULL,
    "destinationType" TEXT NOT NULL DEFAULT 'bank',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME,
    "processedBy" TEXT,
    "rejectionReason" TEXT,
    CONSTRAINT "withdrawal_requests_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users" ("ledgerId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_withdrawal_requests" ("amount", "destination", "destinationType", "displayName", "id", "processedAt", "processedBy", "rejectionReason", "requestedAt", "status") SELECT "amount", "destination", "destinationType", "displayName", "id", "processedAt", "processedBy", "rejectionReason", "requestedAt", "status" FROM "withdrawal_requests";
DROP TABLE "withdrawal_requests";
ALTER TABLE "new_withdrawal_requests" RENAME TO "withdrawal_requests";
CREATE INDEX "withdrawal_requests_ledgerId_idx" ON "withdrawal_requests"("ledgerId");
CREATE INDEX "withdrawal_requests_status_idx" ON "withdrawal_requests"("status");
CREATE INDEX "withdrawal_requests_requestedAt_idx" ON "withdrawal_requests"("requestedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "wallets_ledgerId_key" ON "wallets"("ledgerId");

-- CreateIndex
CREATE INDEX "wallets_ledgerId_idx" ON "wallets"("ledgerId");

-- CreateIndex
CREATE INDEX "deposits_walletId_idx" ON "deposits"("walletId");

-- CreateIndex
CREATE INDEX "deposits_ledgerId_idx" ON "deposits"("ledgerId");

-- CreateIndex
CREATE INDEX "deposits_status_idx" ON "deposits"("status");

-- CreateIndex
CREATE INDEX "withdrawals_walletId_idx" ON "withdrawals"("walletId");

-- CreateIndex
CREATE INDEX "withdrawals_ledgerId_idx" ON "withdrawals"("ledgerId");

-- CreateIndex
CREATE INDEX "withdrawals_status_idx" ON "withdrawals"("status");

-- CreateIndex
CREATE UNIQUE INDEX "audit_logs_txHash_key" ON "audit_logs"("txHash");

-- CreateIndex
CREATE INDEX "audit_logs_eventType_idx" ON "audit_logs"("eventType");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_txHash_idx" ON "audit_logs"("txHash");

-- CreateIndex
CREATE INDEX "audit_logs_poolId_idx" ON "audit_logs"("poolId");

-- CreateIndex
CREATE INDEX "audit_logs_visibleToPublic_idx" ON "audit_logs"("visibleToPublic");

-- CreateIndex
CREATE INDEX "pool_reviews_poolId_idx" ON "pool_reviews"("poolId");

-- CreateIndex
CREATE INDEX "pool_reviews_ledgerId_idx" ON "pool_reviews"("ledgerId");

-- CreateIndex
CREATE UNIQUE INDEX "pool_reviews_poolId_ledgerId_key" ON "pool_reviews"("poolId", "ledgerId");

-- CreateIndex
CREATE UNIQUE INDEX "vertical_configs_slug_key" ON "vertical_configs"("slug");

-- CreateIndex
CREATE INDEX "vertical_configs_slug_idx" ON "vertical_configs"("slug");

-- CreateIndex
CREATE INDEX "vertical_configs_isActive_idx" ON "vertical_configs"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "user_identities_ledgerId_key" ON "user_identities"("ledgerId");

-- CreateIndex
CREATE INDEX "user_identities_ledgerId_idx" ON "user_identities"("ledgerId");

-- CreateIndex
CREATE INDEX "user_identities_kycStatus_idx" ON "user_identities"("kycStatus");

-- CreateIndex
CREATE UNIQUE INDEX "quantum_merit_scores_ledgerId_key" ON "quantum_merit_scores"("ledgerId");

-- CreateIndex
CREATE INDEX "quantum_merit_scores_ledgerId_idx" ON "quantum_merit_scores"("ledgerId");

-- CreateIndex
CREATE INDEX "quantum_merit_scores_totalMeritScore_idx" ON "quantum_merit_scores"("totalMeritScore");

-- CreateIndex
CREATE INDEX "asset_reports_poolId_idx" ON "asset_reports"("poolId");

-- CreateIndex
CREATE INDEX "asset_reports_ledgerId_idx" ON "asset_reports"("ledgerId");

-- CreateIndex
CREATE INDEX "asset_reports_status_idx" ON "asset_reports"("status");

-- CreateIndex
CREATE INDEX "disputes_poolId_idx" ON "disputes"("poolId");

-- CreateIndex
CREATE INDEX "disputes_ledgerId_idx" ON "disputes"("ledgerId");

-- CreateIndex
CREATE INDEX "disputes_status_idx" ON "disputes"("status");

-- CreateIndex
CREATE INDEX "notifications_ledgerId_idx" ON "notifications"("ledgerId");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_read_idx" ON "notifications"("read");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_proposalId_idx" ON "notifications"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "halls_poolId_key" ON "halls"("poolId");

-- CreateIndex
CREATE INDEX "halls_poolId_idx" ON "halls"("poolId");

-- CreateIndex
CREATE INDEX "hall_messages_hallId_createdAt_idx" ON "hall_messages"("hallId", "createdAt");

-- CreateIndex
CREATE INDEX "proposals_poolId_idx" ON "proposals"("poolId");

-- CreateIndex
CREATE INDEX "proposals_hallId_idx" ON "proposals"("hallId");

-- CreateIndex
CREATE INDEX "proposals_status_idx" ON "proposals"("status");

-- CreateIndex
CREATE UNIQUE INDEX "votes_proposalId_userId_key" ON "votes"("proposalId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ownerships_pacToken_key" ON "ownerships"("pacToken");

-- CreateIndex
CREATE INDEX "ownerships_pacToken_idx" ON "ownerships"("pacToken");

-- CreateIndex
CREATE INDEX "ownerships_ledgerId_idx" ON "ownerships"("ledgerId");

-- CreateIndex
CREATE UNIQUE INDEX "ownerships_poolId_userId_key" ON "ownerships"("poolId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "hall_treasuries_hallId_key" ON "hall_treasuries"("hallId");

-- CreateIndex
CREATE INDEX "hall_treasury_transactions_treasuryId_idx" ON "hall_treasury_transactions"("treasuryId");

-- CreateIndex
CREATE INDEX "revenue_logs_poolId_idx" ON "revenue_logs"("poolId");

-- CreateIndex
CREATE INDEX "revenue_logs_distributed_idx" ON "revenue_logs"("distributed");

-- CreateIndex
CREATE UNIQUE INDEX "spv_entities_poolId_key" ON "spv_entities"("poolId");

-- CreateIndex
CREATE INDEX "insurance_transactions_fundId_idx" ON "insurance_transactions"("fundId");

-- CreateIndex
CREATE INDEX "marketplace_items_hallId_idx" ON "marketplace_items"("hallId");

-- CreateIndex
CREATE INDEX "marketplace_items_status_idx" ON "marketplace_items"("status");

-- CreateIndex
CREATE UNIQUE INDEX "social_shares_refCode_key" ON "social_shares"("refCode");

-- CreateIndex
CREATE INDEX "social_shares_itemId_idx" ON "social_shares"("itemId");

-- CreateIndex
CREATE INDEX "social_shares_userId_idx" ON "social_shares"("userId");

-- CreateIndex
CREATE INDEX "marketplace_orders_itemId_idx" ON "marketplace_orders"("itemId");

-- CreateIndex
CREATE INDEX "marketplace_orders_buyerId_idx" ON "marketplace_orders"("buyerId");

-- CreateIndex
CREATE INDEX "marketplace_orders_status_idx" ON "marketplace_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "hall_invites_code_key" ON "hall_invites"("code");

-- CreateIndex
CREATE INDEX "hall_invites_hallId_idx" ON "hall_invites"("hallId");

-- CreateIndex
CREATE INDEX "hall_invites_creatorId_idx" ON "hall_invites"("creatorId");

-- CreateIndex
CREATE INDEX "ban_records_hallId_idx" ON "ban_records"("hallId");

-- CreateIndex
CREATE INDEX "ban_records_userId_idx" ON "ban_records"("userId");

-- CreateIndex
CREATE INDEX "hall_activities_hallId_idx" ON "hall_activities"("hallId");

-- CreateIndex
CREATE INDEX "hall_activities_type_idx" ON "hall_activities"("type");

-- CreateIndex
CREATE UNIQUE INDEX "hall_roles_hallId_userId_role_key" ON "hall_roles"("hallId", "userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_records_userId_key" ON "kyc_records"("userId");

-- CreateIndex
CREATE INDEX "dividend_distributions_poolId_idx" ON "dividend_distributions"("poolId");

-- CreateIndex
CREATE INDEX "dividend_entries_distributionId_idx" ON "dividend_entries"("distributionId");

-- CreateIndex
CREATE INDEX "dividend_entries_ownershipId_idx" ON "dividend_entries"("ownershipId");

-- CreateIndex
CREATE INDEX "location_options_poolId_idx" ON "location_options"("poolId");

-- CreateIndex
CREATE INDEX "dormancy_logs_userId_idx" ON "dormancy_logs"("userId");

-- CreateIndex
CREATE INDEX "dormancy_logs_poolId_idx" ON "dormancy_logs"("poolId");

-- CreateIndex
CREATE INDEX "dormancy_logs_hallId_idx" ON "dormancy_logs"("hallId");

-- CreateIndex
CREATE INDEX "execution_logs_proposalId_idx" ON "execution_logs"("proposalId");

-- CreateIndex
CREATE INDEX "execution_logs_hallId_idx" ON "execution_logs"("hallId");

-- CreateIndex
CREATE INDEX "execution_logs_status_idx" ON "execution_logs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "security_audit_logs_currentHash_key" ON "security_audit_logs"("currentHash");

-- CreateIndex
CREATE INDEX "security_audit_logs_ledgerId_idx" ON "security_audit_logs"("ledgerId");

-- CreateIndex
CREATE INDEX "security_audit_logs_action_idx" ON "security_audit_logs"("action");

-- CreateIndex
CREATE INDEX "security_audit_logs_createdAt_idx" ON "security_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "meridian_cycles_continent_idx" ON "meridian_cycles"("continent");

-- CreateIndex
CREATE INDEX "meridian_cycles_phase_idx" ON "meridian_cycles"("phase");

-- CreateIndex
CREATE INDEX "cycle_pools_cycleId_idx" ON "cycle_pools"("cycleId");

-- CreateIndex
CREATE INDEX "cycle_pools_poolId_idx" ON "cycle_pools"("poolId");

-- CreateIndex
CREATE UNIQUE INDEX "cycle_pools_cycleId_poolId_key" ON "cycle_pools"("cycleId", "poolId");

-- CreateIndex
CREATE INDEX "cycle_votes_cycleId_idx" ON "cycle_votes"("cycleId");

-- CreateIndex
CREATE INDEX "cycle_votes_poolId_idx" ON "cycle_votes"("poolId");

-- CreateIndex
CREATE INDEX "cycle_votes_userId_idx" ON "cycle_votes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "cycle_votes_cycleId_userId_key" ON "cycle_votes"("cycleId", "userId");

-- CreateIndex
CREATE INDEX "oracle_forecasts_status_idx" ON "oracle_forecasts"("status");

-- CreateIndex
CREATE INDEX "oracle_forecasts_type_idx" ON "oracle_forecasts"("type");

-- CreateIndex
CREATE INDEX "oracle_predictions_forecastId_idx" ON "oracle_predictions"("forecastId");

-- CreateIndex
CREATE INDEX "oracle_predictions_userId_idx" ON "oracle_predictions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "oracle_standings_userId_key" ON "oracle_standings"("userId");

-- CreateIndex
CREATE INDEX "oracle_standings_userId_idx" ON "oracle_standings"("userId");

-- CreateIndex
CREATE INDEX "oracle_standings_tier_idx" ON "oracle_standings"("tier");

-- CreateIndex
CREATE INDEX "oracle_standings_totalPoints_idx" ON "oracle_standings"("totalPoints");

-- CreateIndex
CREATE UNIQUE INDEX "executive_cabinets_hallId_key" ON "executive_cabinets"("hallId");

-- CreateIndex
CREATE INDEX "executive_cabinets_hallId_idx" ON "executive_cabinets"("hallId");

-- CreateIndex
CREATE UNIQUE INDEX "workers_workerNumber_key" ON "workers"("workerNumber");

-- CreateIndex
CREATE INDEX "workers_hallId_idx" ON "workers"("hallId");

-- CreateIndex
CREATE INDEX "workers_workerNumber_idx" ON "workers"("workerNumber");

-- CreateIndex
CREATE INDEX "workers_status_idx" ON "workers"("status");

-- CreateIndex
CREATE INDEX "worker_performances_workerId_idx" ON "worker_performances"("workerId");

-- CreateIndex
CREATE INDEX "worker_performances_reviewedAt_idx" ON "worker_performances"("reviewedAt");

-- CreateIndex
CREATE INDEX "forge_ledgers_hallId_idx" ON "forge_ledgers"("hallId");

-- CreateIndex
CREATE UNIQUE INDEX "forge_ledgers_hallId_month_key" ON "forge_ledgers"("hallId", "month");

-- CreateIndex
CREATE INDEX "relay_messages_hallId_idx" ON "relay_messages"("hallId");

-- CreateIndex
CREATE INDEX "relay_messages_workerId_idx" ON "relay_messages"("workerId");

-- CreateIndex
CREATE INDEX "relay_messages_direction_idx" ON "relay_messages"("direction");

-- CreateIndex
CREATE INDEX "sri_snapshots_hallId_idx" ON "sri_snapshots"("hallId");

-- CreateIndex
CREATE INDEX "sri_snapshots_recordedAt_idx" ON "sri_snapshots"("recordedAt");

-- CreateIndex
CREATE INDEX "ahgi_snapshots_hallId_idx" ON "ahgi_snapshots"("hallId");

-- CreateIndex
CREATE INDEX "ahgi_snapshots_recordedAt_idx" ON "ahgi_snapshots"("recordedAt");

-- CreateIndex
CREATE INDEX "dynamic_valuations_hallId_idx" ON "dynamic_valuations"("hallId");

-- CreateIndex
CREATE INDEX "dynamic_valuations_calculatedAt_idx" ON "dynamic_valuations"("calculatedAt");

-- CreateIndex
CREATE INDEX "pir_allocations_hallId_idx" ON "pir_allocations"("hallId");

-- CreateIndex
CREATE INDEX "pir_allocations_pillar_idx" ON "pir_allocations"("pillar");

-- CreateIndex
CREATE INDEX "pir_advances_hallId_idx" ON "pir_advances"("hallId");

-- CreateIndex
CREATE INDEX "pir_advances_status_idx" ON "pir_advances"("status");

-- CreateIndex
CREATE INDEX "closure_protocols_hallId_idx" ON "closure_protocols"("hallId");

-- CreateIndex
CREATE INDEX "closure_protocols_phase_idx" ON "closure_protocols"("phase");

-- CreateIndex
CREATE INDEX "closure_protocols_status_idx" ON "closure_protocols"("status");

-- CreateIndex
CREATE INDEX "liquidation_payouts_closureId_idx" ON "liquidation_payouts"("closureId");

-- CreateIndex
CREATE INDEX "liquidation_payouts_userId_idx" ON "liquidation_payouts"("userId");

-- CreateIndex
CREATE INDEX "dormancy_vaults_userId_idx" ON "dormancy_vaults"("userId");

-- CreateIndex
CREATE INDEX "dormancy_vaults_ownershipId_idx" ON "dormancy_vaults"("ownershipId");

-- CreateIndex
CREATE INDEX "dormancy_vaults_status_idx" ON "dormancy_vaults"("status");

-- CreateIndex
CREATE INDEX "dormancy_auctions_vaultId_idx" ON "dormancy_auctions"("vaultId");

-- CreateIndex
CREATE INDEX "dormancy_auctions_buyerId_idx" ON "dormancy_auctions"("buyerId");

-- CreateIndex
CREATE INDEX "dormancy_auctions_status_idx" ON "dormancy_auctions"("status");

-- CreateIndex
CREATE INDEX "agora_suggestions_userId_idx" ON "agora_suggestions"("userId");

-- CreateIndex
CREATE INDEX "agora_suggestions_status_idx" ON "agora_suggestions"("status");

-- CreateIndex
CREATE INDEX "agora_suggestions_continent_idx" ON "agora_suggestions"("continent");

-- CreateIndex
CREATE INDEX "agora_suggestion_votes_suggestionId_idx" ON "agora_suggestion_votes"("suggestionId");

-- CreateIndex
CREATE INDEX "agora_suggestion_votes_userId_idx" ON "agora_suggestion_votes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "agora_suggestion_votes_suggestionId_userId_key" ON "agora_suggestion_votes"("suggestionId", "userId");

-- CreateIndex
CREATE INDEX "agora_qas_userId_idx" ON "agora_qas"("userId");

-- CreateIndex
CREATE INDEX "agora_qas_status_idx" ON "agora_qas"("status");

-- CreateIndex
CREATE INDEX "eighth_ledger_updates_hallId_idx" ON "eighth_ledger_updates"("hallId");

-- CreateIndex
CREATE INDEX "eighth_ledger_updates_type_idx" ON "eighth_ledger_updates"("type");

-- CreateIndex
CREATE INDEX "eighth_ledger_updates_createdAt_idx" ON "eighth_ledger_updates"("createdAt");

-- CreateIndex
CREATE INDEX "sovereign_stream_posts_hallId_idx" ON "sovereign_stream_posts"("hallId");

-- CreateIndex
CREATE INDEX "sovereign_stream_posts_type_idx" ON "sovereign_stream_posts"("type");

-- CreateIndex
CREATE INDEX "sovereign_stream_posts_authorId_idx" ON "sovereign_stream_posts"("authorId");

-- CreateIndex
CREATE INDEX "sovereign_stream_posts_proposalId_idx" ON "sovereign_stream_posts"("proposalId");

-- CreateIndex
CREATE INDEX "sovereign_stream_posts_parentId_idx" ON "sovereign_stream_posts"("parentId");

-- CreateIndex
CREATE INDEX "inventory_items_hallId_idx" ON "inventory_items"("hallId");

-- CreateIndex
CREATE INDEX "inventory_items_status_idx" ON "inventory_items"("status");

-- CreateIndex
CREATE INDEX "inventory_orders_inventoryId_idx" ON "inventory_orders"("inventoryId");

-- CreateIndex
CREATE INDEX "inventory_orders_buyerId_idx" ON "inventory_orders"("buyerId");

-- CreateIndex
CREATE INDEX "inventory_orders_status_idx" ON "inventory_orders"("status");

-- CreateIndex
CREATE INDEX "ownership_listings_hallId_idx" ON "ownership_listings"("hallId");

-- CreateIndex
CREATE INDEX "ownership_listings_sellerId_idx" ON "ownership_listings"("sellerId");

-- CreateIndex
CREATE INDEX "ownership_listings_buyerId_idx" ON "ownership_listings"("buyerId");

-- CreateIndex
CREATE INDEX "ownership_listings_status_idx" ON "ownership_listings"("status");

-- CreateIndex
CREATE INDEX "ownership_listings_ownershipId_idx" ON "ownership_listings"("ownershipId");
