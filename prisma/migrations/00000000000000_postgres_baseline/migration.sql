-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
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
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIP" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
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
    "kycVerifiedAt" TIMESTAMP(3),
    "role" TEXT NOT NULL DEFAULT 'user',
    "isPrimaryAdmin" BOOLEAN NOT NULL DEFAULT false,
    "legalName" TEXT,
    "idNumber" TEXT,
    "idDocumentUrl" TEXT,
    "addressProofUrl" TEXT,
    "selfieUrl" TEXT,
    "livenessVerified" BOOLEAN NOT NULL DEFAULT false,
    "kycTier" TEXT NOT NULL DEFAULT 'visitor',
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceFingerprint" TEXT,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" TEXT,
    "beneficiaryName" TEXT,
    "beneficiaryEmail" TEXT,
    "adminTotpSecret" TEXT,
    "adminTotpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "adminPinHash" TEXT,
    "adminPinAttempts" INTEGER NOT NULL DEFAULT 0,
    "adminLockedUntil" TIMESTAMP(3),
    "lastAdminAccessAt" TIMESTAMP(3),
    "lastAdminIP" TEXT,
    "adminAccessCount" INTEGER NOT NULL DEFAULT 0,
    "founderTotpSecret" TEXT,
    "founderTotpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "founderPinHash" TEXT,
    "webauthnCredentialId" TEXT,
    "webauthnPublicKey" TEXT,
    "webauthnCounter" INTEGER NOT NULL DEFAULT 0,
    "lastFounderAccessAt" TIMESTAMP(3),
    "lastFounderIP" TEXT,
    "founderAccessCount" INTEGER NOT NULL DEFAULT 0,
    "founderPinAttempts" INTEGER NOT NULL DEFAULT 0,
    "founderLockedUntil" TIMESTAMP(3),
    "founderAccessWindowStart" INTEGER,
    "founderAccessWindowEnd" INTEGER,
    "founderTrustedLat" DOUBLE PRECISION,
    "founderTrustedLng" DOUBLE PRECISION,
    "founderGeoRadiusKm" INTEGER NOT NULL DEFAULT 50,
    "globalSriScore" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceFingerprint" TEXT,
    "geoCountry" TEXT,
    "geoCity" TEXT,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotationCount" INTEGER NOT NULL DEFAULT 0,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "anomalyFlags" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lockedBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "walletId" TEXT,
    "type" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'posted',
    "referenceType" TEXT,
    "referenceId" TEXT,
    "idempotencyKey" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposits" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "method" TEXT NOT NULL DEFAULT 'bank_transfer',
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawals" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "destination" TEXT NOT NULL,
    "destinationType" TEXT NOT NULL DEFAULT 'bank',
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "processedBy" TEXT,
    "rejectionReason" TEXT,

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pools" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "distributedAt" TIMESTAMP(3),
    "trueCost" INTEGER,
    "listedPrice" INTEGER,
    "surplus" INTEGER,
    "managementFee" DOUBLE PRECISION NOT NULL DEFAULT 20.00,
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
    "assetType" TEXT,
    "revenueSources" TEXT,
    "hallClass" TEXT,
    "pirAllocation" TEXT,
    "assetBookValue" INTEGER NOT NULL DEFAULT 0,
    "insuranceAllocation" INTEGER,
    "executionQueue" TEXT,
    "ihcpTarget" INTEGER,

    CONSTRAINT "pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "filled" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txHash" TEXT NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trades" (
    "id" TEXT NOT NULL,
    "buyOrderId" TEXT NOT NULL,
    "sellOrderId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txHash" TEXT NOT NULL,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knot_members" (
    "id" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalCommitted" INTEGER NOT NULL DEFAULT 0,
    "poolsWon" INTEGER NOT NULL DEFAULT 0,
    "trustScore" INTEGER NOT NULL DEFAULT 100,
    "referrals" INTEGER NOT NULL DEFAULT 0,
    "depth" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'active',
    "referredBy" TEXT,

    CONSTRAINT "knot_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_rewards" (
    "id" TEXT NOT NULL,
    "toLedgerId" TEXT NOT NULL,
    "fromLedgerId" TEXT NOT NULL,
    "fromDisplayName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "rewardPercent" DOUBLE PRECISION NOT NULL,
    "rewardAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treasury_transactions" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "poolId" TEXT,
    "ledgerId" TEXT,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "txHash" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "audited" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "treasury_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawal_requests" (
    "id" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "destination" TEXT NOT NULL,
    "destinationType" TEXT NOT NULL DEFAULT 'bank',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "processedBy" TEXT,
    "rejectionReason" TEXT,

    CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_events" (
    "id" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "description" TEXT,
    "metadata" TEXT,
    "amount" INTEGER,
    "points" INTEGER,

    CONSTRAINT "activity_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "propertyName" TEXT NOT NULL,
    "verticalId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "helpful" INTEGER NOT NULL DEFAULT 0,
    "reported" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'visible',

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tier_milestones" (
    "id" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trustScore" INTEGER NOT NULL,
    "triggeredBy" TEXT NOT NULL,

    CONSTRAINT "tier_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_entries" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER,
    "txHash" TEXT NOT NULL,
    "previousHash" TEXT,
    "ledgerId" TEXT,
    "poolId" TEXT,

    CONSTRAINT "audit_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "poolId" TEXT,
    "ledgerId" TEXT,
    "amount" INTEGER,
    "metadata" TEXT,
    "txHash" TEXT NOT NULL,
    "visibleToPublic" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocol_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "platformFee" INTEGER NOT NULL DEFAULT 0,
    "minCommitment" INTEGER NOT NULL DEFAULT 50,
    "maxCommitment" INTEGER NOT NULL DEFAULT 50000,
    "consensusThreshold" INTEGER NOT NULL DEFAULT 2,
    "publicAudit" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "pirEnabled" BOOLEAN NOT NULL DEFAULT true,
    "oracleEnabled" BOOLEAN NOT NULL DEFAULT true,
    "meridianCycleEnabled" BOOLEAN NOT NULL DEFAULT true,
    "closureProtocolEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dormancyProtocolEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dynamicValuationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "forgeLedgerEnabled" BOOLEAN NOT NULL DEFAULT true,
    "eighthLedgerTithe" INTEGER NOT NULL DEFAULT 20,

    CONSTRAINT "protocol_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "maxUses" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "invite_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pool_reviews" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pool_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vertical_configs" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vertical_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_identities" (
    "id" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "kycStatus" TEXT NOT NULL DEFAULT 'unverified',
    "verificationTier" INTEGER NOT NULL DEFAULT 0,
    "idDocumentUrl" TEXT,
    "selfieUrl" TEXT,
    "proofOfAddressUrl" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "rejectionReason" TEXT,
    "identityScore" INTEGER NOT NULL DEFAULT 0,
    "countryVerified" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quantum_merit_scores" (
    "id" TEXT NOT NULL,
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
    "calculatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quantum_merit_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_reports" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,

    CONSTRAINT "asset_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "poolId" TEXT,
    "proposalId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "halls" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ghost',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
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

    CONSTRAINT "halls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hall_messages" (
    "id" TEXT NOT NULL,
    "hallId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "watermarkHash" TEXT NOT NULL,
    "isEphemeral" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hall_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "hallId" TEXT,
    "proposerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER,
    "targetUserId" TEXT,
    "locationOption" TEXT,
    "voteWeightYes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "voteWeightNo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "voteCountYes" INTEGER NOT NULL DEFAULT 0,
    "voteCountNo" INTEGER NOT NULL DEFAULT 0,
    "thresholdPercent" DOUBLE PRECISION NOT NULL DEFAULT 51.00,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "executionStatus" TEXT DEFAULT 'pending',
    "executedAt" TIMESTAMP(3),
    "executionResult" TEXT,
    "executionCost" INTEGER,
    "executionProof" TEXT,
    "executionNotes" TEXT,
    "stalledReason" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "passedAt" TIMESTAMP(3),
    "executedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "choice" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ownerships" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hallId" TEXT,
    "amountCommitted" INTEGER NOT NULL,
    "ownershipPercent" DOUBLE PRECISION NOT NULL,
    "pacToken" TEXT,
    "totalReturned" INTEGER NOT NULL DEFAULT 0,
    "totalFromSale" INTEGER NOT NULL DEFAULT 0,
    "totalFromMarket" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "role" TEXT,
    "roleExpiresAt" TIMESTAMP(3),
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "inviteCodesRemaining" INTEGER NOT NULL DEFAULT 3,
    "inviteCodesUsed" INTEGER NOT NULL DEFAULT 0,
    "dynamicValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accumulatedDividends" INTEGER NOT NULL DEFAULT 0,
    "pirDebt" INTEGER NOT NULL DEFAULT 0,
    "ihcpDebt" INTEGER NOT NULL DEFAULT 0,
    "ledgerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ownerships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hall_treasuries" (
    "id" TEXT NOT NULL,
    "hallId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "totalDistributed" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" INTEGER NOT NULL DEFAULT 0,
    "lastDistribution" TIMESTAMP(3),
    "payrollReserve" INTEGER NOT NULL DEFAULT 0,
    "pirDebt" INTEGER NOT NULL DEFAULT 0,
    "closureReserve" INTEGER NOT NULL DEFAULT 0,
    "monthlyRevenue" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "hall_treasuries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hall_treasury_transactions" (
    "id" TEXT NOT NULL,
    "treasuryId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hall_treasury_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_logs" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "ledgerFee" INTEGER NOT NULL,
    "communityNet" INTEGER NOT NULL,
    "distributed" BOOLEAN NOT NULL DEFAULT false,
    "distributionTx" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payrollDeducted" INTEGER NOT NULL DEFAULT 0,
    "netAfterPayroll" INTEGER NOT NULL DEFAULT 0,
    "businessSource" TEXT,

    CONSTRAINT "revenue_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spv_entities" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entityType" TEXT NOT NULL DEFAULT 'llc',
    "jurisdiction" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "registeredAt" TIMESTAMP(3),
    "bankAccount" TEXT,
    "taxId" TEXT,
    "documents" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spv_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_funds" (
    "id" TEXT NOT NULL,
    "poolId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'global',
    "balance" INTEGER NOT NULL DEFAULT 0,
    "totalContributed" INTEGER NOT NULL DEFAULT 0,
    "totalClaimsPaid" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "insurance_funds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_transactions" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insurance_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_shares" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refCode" TEXT NOT NULL,
    "platform" TEXT,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "commissionEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hall_invites" (
    "id" TEXT NOT NULL,
    "hallId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hall_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ban_records" (
    "id" TEXT NOT NULL,
    "hallId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bannedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" TEXT,
    "duration" TEXT NOT NULL DEFAULT 'permanent',
    "expiresAt" TIMESTAMP(3),
    "isAppealed" BOOLEAN NOT NULL DEFAULT false,
    "appealReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ban_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hall_activities" (
    "id" TEXT NOT NULL,
    "hallId" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hall_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hall_roles" (
    "id" TEXT NOT NULL,
    "hallId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "electedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "votesReceived" INTEGER NOT NULL DEFAULT 0,
    "isImpeached" BOOLEAN NOT NULL DEFAULT false,
    "impeachedAt" TIMESTAMP(3),
    "impeachReason" TEXT,

    CONSTRAINT "hall_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "idType" TEXT,
    "idNumber" TEXT,
    "idImageUrl" TEXT,
    "idVerified" BOOLEAN NOT NULL DEFAULT false,
    "selfieUrl" TEXT,
    "selfieMatchScore" DOUBLE PRECISION,
    "selfieVerified" BOOLEAN NOT NULL DEFAULT false,
    "livenessVideoUrl" TEXT,
    "livenessPassed" BOOLEAN NOT NULL DEFAULT false,
    "addressProofUrl" TEXT,
    "addressVerified" BOOLEAN NOT NULL DEFAULT false,
    "legalName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "address" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'visitor',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dividend_distributions" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "revenueLogId" TEXT,
    "totalAmount" INTEGER NOT NULL,
    "totalOwners" INTEGER NOT NULL,
    "distributedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dividend_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dividend_entries" (
    "id" TEXT NOT NULL,
    "distributionId" TEXT NOT NULL,
    "ownershipId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" TIMESTAMP(3),

    CONSTRAINT "dividend_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_options" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "hallId" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "cost" INTEGER,
    "image" TEXT,
    "description" TEXT,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "voteWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dormancy_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "poolId" TEXT,
    "hallId" TEXT,
    "type" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "notifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "dormancy_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execution_logs" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT,
    "hallId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'passed',
    "cost" DOUBLE PRECISION,
    "proofUrls" TEXT,
    "executedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "execution_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_audit_logs" (
    "id" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "deviceFingerprint" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "success" BOOLEAN NOT NULL,
    "details" TEXT,
    "previousHash" TEXT,
    "currentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meridian_cycles" (
    "id" TEXT NOT NULL,
    "continent" TEXT NOT NULL,
    "phase" TEXT NOT NULL DEFAULT 'hush',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "lockStatus" TEXT NOT NULL DEFAULT 'unlocked',
    "winnerPoolId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meridian_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cycle_pools" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "voteWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "revealedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cycle_pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cycle_votes" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "votedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cycle_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oracle_forecasts" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "verticalOptions" TEXT NOT NULL,
    "countryOptions" TEXT NOT NULL,
    "lockDate" TIMESTAMP(3) NOT NULL,
    "resolveDate" TIMESTAMP(3),
    "resolvedOutcome" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oracle_forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oracle_predictions" (
    "id" TEXT NOT NULL,
    "forecastId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vertical" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oracle_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oracle_standings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "totalPredictions" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'novice',
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastCorrectAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oracle_standings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_cabinets" (
    "id" TEXT NOT NULL,
    "hallId" TEXT NOT NULL,
    "speakerId" TEXT,
    "treasurerId" TEXT,
    "wardenId" TEXT,
    "scribeId" TEXT,
    "electedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isImpeached" BOOLEAN NOT NULL DEFAULT false,
    "impeachedAt" TIMESTAMP(3),
    "impeachReason" TEXT,

    CONSTRAINT "executive_cabinets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workers" (
    "id" TEXT NOT NULL,
    "hallId" TEXT NOT NULL,
    "workerNumber" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "salary" INTEGER NOT NULL,
    "contractMonths" INTEGER NOT NULL,
    "hiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    "performanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "terminationReason" TEXT,
    "terminatedAt" TIMESTAMP(3),
    "shiftSchedule" TEXT,
    "department" TEXT,

    CONSTRAINT "workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_performances" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metrics" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "improvementPlan" TEXT,
    "isTerminated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "worker_performances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forge_ledgers" (
    "id" TEXT NOT NULL,
    "hallId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "totalPayroll" INTEGER NOT NULL,
    "workerCount" INTEGER NOT NULL,
    "entries" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "businessRevenue" INTEGER NOT NULL DEFAULT 0,
    "costOfGoodsSold" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "forge_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relay_messages" (
    "id" TEXT NOT NULL,
    "hallId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "relayedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'relayed',
    "loggedBy" TEXT NOT NULL,

    CONSTRAINT "relay_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sri_snapshots" (
    "id" TEXT NOT NULL,
    "hallId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 50,
    "governanceActivity" INTEGER NOT NULL DEFAULT 0,
    "revenueConsistency" INTEGER NOT NULL DEFAULT 0,
    "dividendReliability" INTEGER NOT NULL DEFAULT 0,
    "proposalQuality" INTEGER NOT NULL DEFAULT 0,
    "dormancyRate" INTEGER NOT NULL DEFAULT 0,
    "marketplaceVelocity" INTEGER NOT NULL DEFAULT 0,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sri_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ahgi_snapshots" (
    "id" TEXT NOT NULL,
    "hallId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 50,
    "healthMetrics" TEXT,
    "growthMetrics" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ahgi_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dynamic_valuations" (
    "id" TEXT NOT NULL,
    "hallId" TEXT NOT NULL,
    "assetBookValue" INTEGER NOT NULL DEFAULT 0,
    "accumulatedDividendsPerPercent" INTEGER NOT NULL DEFAULT 0,
    "ahgiPremium" INTEGER NOT NULL DEFAULT 0,
    "sriBonus" INTEGER NOT NULL DEFAULT 0,
    "pirDebtPerPercent" INTEGER NOT NULL DEFAULT 0,
    "ihcpDebtPerPercent" INTEGER NOT NULL DEFAULT 0,
    "valuePerPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dynamic_valuations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pir_allocations" (
    "id" TEXT NOT NULL,
    "hallId" TEXT NOT NULL,
    "pillar" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL,
    "spent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pir_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pir_advances" (
    "id" TEXT NOT NULL,
    "hallId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "repaymentRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "repaidAmount" INTEGER NOT NULL DEFAULT 0,
    "interestRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "approvedBy" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),

    CONSTRAINT "pir_advances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "closure_protocols" (
    "id" TEXT NOT NULL,
    "hallId" TEXT NOT NULL,
    "triggerMonth" TIMESTAMP(3) NOT NULL,
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
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "closure_protocols_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liquidation_payouts" (
    "id" TEXT NOT NULL,
    "closureId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ownershipPercent" DOUBLE PRECISION NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "liquidation_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dormancy_vaults" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ownershipId" TEXT NOT NULL,
    "vaultedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accumulatedDividends" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'vaulted',
    "reclaimedAt" TIMESTAMP(3),

    CONSTRAINT "dormancy_vaults_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dormancy_auctions" (
    "id" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "listedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startingPrice" INTEGER NOT NULL,
    "finalPrice" INTEGER,
    "buyerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "dormancy_auctions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agora_suggestions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "continent" TEXT NOT NULL,
    "vertical" TEXT NOT NULL,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agora_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agora_suggestion_votes" (
    "id" TEXT NOT NULL,
    "suggestionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agora_suggestion_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agora_qas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "answeredBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "agora_qas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eighth_ledger_updates" (
    "id" TEXT NOT NULL,
    "hallId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "amount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eighth_ledger_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sovereign_stream_posts" (
    "id" TEXT NOT NULL,
    "hallId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "proposalId" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sovereign_stream_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "hallId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "quantitySold" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "listedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "costOfGoods" INTEGER NOT NULL DEFAULT 0,
    "reorderThreshold" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "images" TEXT,
    "tags" TEXT,
    "specs" TEXT,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_items" (
    "id" TEXT NOT NULL,
    "poolId" TEXT,
    "hallId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "quantitySold" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_orders" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "escrowReleasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "platformFee" INTEGER NOT NULL DEFAULT 0,
    "fulfillmentCost" INTEGER NOT NULL DEFAULT 0,
    "netToHall" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "inventory_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ownership_listings" (
    "id" TEXT NOT NULL,
    "ownershipId" TEXT NOT NULL,
    "hallId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "percentListed" DOUBLE PRECISION NOT NULL,
    "pricePerPercent" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "floorPrice" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "listedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "soldAt" TIMESTAMP(3),
    "buyerId" TEXT,
    "escrowStartedAt" TIMESTAMP(3),
    "escrowExpiresAt" TIMESTAMP(3),
    "auditHash" TEXT,
    "belowFloorApproved" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "interestCount" INTEGER NOT NULL DEFAULT 0,
    "isFractional" BOOLEAN NOT NULL DEFAULT false,
    "sellerKycTier" TEXT,

    CONSTRAINT "ownership_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hall_contributions" (
    "id" TEXT NOT NULL,
    "hallId" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL,
    "repaidAmount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hall_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_ledgerId_key" ON "users"("ledgerId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_ledgerId_idx" ON "users"("ledgerId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tier_idx" ON "users"("tier");

-- CreateIndex
CREATE INDEX "users_trustScore_idx" ON "users"("trustScore");

-- CreateIndex
CREATE INDEX "users_kycStatus_idx" ON "users"("kycStatus");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_ledgerId_idx" ON "sessions"("ledgerId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "sessions_isRevoked_idx" ON "sessions"("isRevoked");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_ledgerId_key" ON "wallets"("ledgerId");

-- CreateIndex
CREATE INDEX "wallets_ledgerId_idx" ON "wallets"("ledgerId");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_entries_idempotencyKey_key" ON "ledger_entries"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ledger_entries_ledgerId_idx" ON "ledger_entries"("ledgerId");

-- CreateIndex
CREATE INDEX "ledger_entries_walletId_idx" ON "ledger_entries"("walletId");

-- CreateIndex
CREATE INDEX "ledger_entries_type_idx" ON "ledger_entries"("type");

-- CreateIndex
CREATE INDEX "ledger_entries_referenceType_referenceId_idx" ON "ledger_entries"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "ledger_entries_createdAt_idx" ON "ledger_entries"("createdAt");

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
CREATE UNIQUE INDEX "pools_poolId_key" ON "pools"("poolId");

-- CreateIndex
CREATE INDEX "pools_verticalId_idx" ON "pools"("verticalId");

-- CreateIndex
CREATE INDEX "pools_status_idx" ON "pools"("status");

-- CreateIndex
CREATE INDEX "pools_country_idx" ON "pools"("country");

-- CreateIndex
CREATE INDEX "pools_closesAt_idx" ON "pools"("closesAt");

-- CreateIndex
CREATE INDEX "pools_isVerified_idx" ON "pools"("isVerified");

-- CreateIndex
CREATE UNIQUE INDEX "orders_txHash_key" ON "orders"("txHash");

-- CreateIndex
CREATE INDEX "orders_ledgerId_idx" ON "orders"("ledgerId");

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
CREATE UNIQUE INDEX "knot_members_ledgerId_key" ON "knot_members"("ledgerId");

-- CreateIndex
CREATE INDEX "knot_members_referredBy_idx" ON "knot_members"("referredBy");

-- CreateIndex
CREATE INDEX "knot_members_depth_idx" ON "knot_members"("depth");

-- CreateIndex
CREATE INDEX "referral_rewards_toLedgerId_idx" ON "referral_rewards"("toLedgerId");

-- CreateIndex
CREATE INDEX "referral_rewards_fromLedgerId_idx" ON "referral_rewards"("fromLedgerId");

-- CreateIndex
CREATE INDEX "referral_rewards_status_idx" ON "referral_rewards"("status");

-- CreateIndex
CREATE UNIQUE INDEX "treasury_transactions_txHash_key" ON "treasury_transactions"("txHash");

-- CreateIndex
CREATE INDEX "treasury_transactions_type_idx" ON "treasury_transactions"("type");

-- CreateIndex
CREATE INDEX "treasury_transactions_ledgerId_idx" ON "treasury_transactions"("ledgerId");

-- CreateIndex
CREATE INDEX "treasury_transactions_timestamp_idx" ON "treasury_transactions"("timestamp");

-- CreateIndex
CREATE INDEX "withdrawal_requests_ledgerId_idx" ON "withdrawal_requests"("ledgerId");

-- CreateIndex
CREATE INDEX "withdrawal_requests_status_idx" ON "withdrawal_requests"("status");

-- CreateIndex
CREATE INDEX "withdrawal_requests_requestedAt_idx" ON "withdrawal_requests"("requestedAt");

-- CreateIndex
CREATE INDEX "activity_events_ledgerId_idx" ON "activity_events"("ledgerId");

-- CreateIndex
CREATE INDEX "activity_events_type_idx" ON "activity_events"("type");

-- CreateIndex
CREATE INDEX "activity_events_date_idx" ON "activity_events"("date");

-- CreateIndex
CREATE INDEX "reviews_ledgerId_idx" ON "reviews"("ledgerId");

-- CreateIndex
CREATE INDEX "reviews_verticalId_idx" ON "reviews"("verticalId");

-- CreateIndex
CREATE INDEX "reviews_status_idx" ON "reviews"("status");

-- CreateIndex
CREATE INDEX "tier_milestones_ledgerId_idx" ON "tier_milestones"("ledgerId");

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
CREATE INDEX "audit_entries_previousHash_idx" ON "audit_entries"("previousHash");

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
CREATE UNIQUE INDEX "protocol_settings_key_key" ON "protocol_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "invite_codes_code_key" ON "invite_codes"("code");

-- CreateIndex
CREATE INDEX "invite_codes_ownerId_idx" ON "invite_codes"("ownerId");

-- CreateIndex
CREATE INDEX "invite_codes_code_idx" ON "invite_codes"("code");

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
CREATE UNIQUE INDEX "social_shares_refCode_key" ON "social_shares"("refCode");

-- CreateIndex
CREATE INDEX "social_shares_itemId_idx" ON "social_shares"("itemId");

-- CreateIndex
CREATE INDEX "social_shares_userId_idx" ON "social_shares"("userId");

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
CREATE INDEX "marketplace_items_hallId_idx" ON "marketplace_items"("hallId");

-- CreateIndex
CREATE INDEX "marketplace_items_poolId_idx" ON "marketplace_items"("poolId");

-- CreateIndex
CREATE INDEX "marketplace_items_status_idx" ON "marketplace_items"("status");

-- CreateIndex
CREATE INDEX "inventory_orders_inventoryId_idx" ON "inventory_orders"("inventoryId");

-- CreateIndex
CREATE INDEX "inventory_orders_buyerId_idx" ON "inventory_orders"("buyerId");

-- CreateIndex
CREATE INDEX "inventory_orders_status_idx" ON "inventory_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ownership_listings_auditHash_key" ON "ownership_listings"("auditHash");

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

-- CreateIndex
CREATE INDEX "hall_contributions_hallId_idx" ON "hall_contributions"("hallId");

-- CreateIndex
CREATE INDEX "hall_contributions_ledgerId_idx" ON "hall_contributions"("ledgerId");

-- CreateIndex
CREATE INDEX "hall_contributions_status_idx" ON "hall_contributions"("status");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users"("ledgerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users"("ledgerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users"("ledgerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_buyOrderId_fkey" FOREIGN KEY ("buyOrderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_sellOrderId_fkey" FOREIGN KEY ("sellOrderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("ledgerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("ledgerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knot_members" ADD CONSTRAINT "knot_members_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users"("ledgerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_toLedgerId_fkey" FOREIGN KEY ("toLedgerId") REFERENCES "users"("ledgerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_fromLedgerId_fkey" FOREIGN KEY ("fromLedgerId") REFERENCES "users"("ledgerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treasury_transactions" ADD CONSTRAINT "treasury_transactions_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("poolId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users"("ledgerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users"("ledgerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users"("ledgerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tier_milestones" ADD CONSTRAINT "tier_milestones_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users"("ledgerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_entries" ADD CONSTRAINT "audit_entries_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users"("ledgerId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_entries" ADD CONSTRAINT "audit_entries_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users"("ledgerId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pool_reviews" ADD CONSTRAINT "pool_reviews_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("poolId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pool_reviews" ADD CONSTRAINT "pool_reviews_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users"("ledgerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_identities" ADD CONSTRAINT "user_identities_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users"("ledgerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quantum_merit_scores" ADD CONSTRAINT "quantum_merit_scores_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users"("ledgerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_reports" ADD CONSTRAINT "asset_reports_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("poolId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_reports" ADD CONSTRAINT "asset_reports_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users"("ledgerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("poolId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users"("ledgerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users"("ledgerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "halls" ADD CONSTRAINT "halls_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hall_messages" ADD CONSTRAINT "hall_messages_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hall_messages" ADD CONSTRAINT "hall_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_proposerId_fkey" FOREIGN KEY ("proposerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownerships" ADD CONSTRAINT "ownerships_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownerships" ADD CONSTRAINT "ownerships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownerships" ADD CONSTRAINT "ownerships_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hall_treasuries" ADD CONSTRAINT "hall_treasuries_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hall_treasury_transactions" ADD CONSTRAINT "hall_treasury_transactions_treasuryId_fkey" FOREIGN KEY ("treasuryId") REFERENCES "hall_treasuries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_logs" ADD CONSTRAINT "revenue_logs_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spv_entities" ADD CONSTRAINT "spv_entities_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_funds" ADD CONSTRAINT "insurance_funds_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_transactions" ADD CONSTRAINT "insurance_transactions_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "insurance_funds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_shares" ADD CONSTRAINT "social_shares_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_shares" ADD CONSTRAINT "social_shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hall_invites" ADD CONSTRAINT "hall_invites_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hall_invites" ADD CONSTRAINT "hall_invites_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ban_records" ADD CONSTRAINT "ban_records_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ban_records" ADD CONSTRAINT "ban_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ban_records" ADD CONSTRAINT "ban_records_bannedById_fkey" FOREIGN KEY ("bannedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hall_activities" ADD CONSTRAINT "hall_activities_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hall_activities" ADD CONSTRAINT "hall_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hall_roles" ADD CONSTRAINT "hall_roles_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hall_roles" ADD CONSTRAINT "hall_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_records" ADD CONSTRAINT "kyc_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dividend_entries" ADD CONSTRAINT "dividend_entries_distributionId_fkey" FOREIGN KEY ("distributionId") REFERENCES "dividend_distributions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dividend_entries" ADD CONSTRAINT "dividend_entries_ownershipId_fkey" FOREIGN KEY ("ownershipId") REFERENCES "ownerships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_options" ADD CONSTRAINT "location_options_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_options" ADD CONSTRAINT "location_options_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_logs" ADD CONSTRAINT "execution_logs_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_logs" ADD CONSTRAINT "execution_logs_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_audit_logs" ADD CONSTRAINT "security_audit_logs_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users"("ledgerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_pools" ADD CONSTRAINT "cycle_pools_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "meridian_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_pools" ADD CONSTRAINT "cycle_pools_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_votes" ADD CONSTRAINT "cycle_votes_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "meridian_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_votes" ADD CONSTRAINT "cycle_votes_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "cycle_pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oracle_predictions" ADD CONSTRAINT "oracle_predictions_forecastId_fkey" FOREIGN KEY ("forecastId") REFERENCES "oracle_forecasts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oracle_predictions" ADD CONSTRAINT "oracle_predictions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oracle_standings" ADD CONSTRAINT "oracle_standings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_cabinets" ADD CONSTRAINT "executive_cabinets_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workers" ADD CONSTRAINT "workers_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_performances" ADD CONSTRAINT "worker_performances_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forge_ledgers" ADD CONSTRAINT "forge_ledgers_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relay_messages" ADD CONSTRAINT "relay_messages_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relay_messages" ADD CONSTRAINT "relay_messages_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sri_snapshots" ADD CONSTRAINT "sri_snapshots_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ahgi_snapshots" ADD CONSTRAINT "ahgi_snapshots_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dynamic_valuations" ADD CONSTRAINT "dynamic_valuations_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pir_allocations" ADD CONSTRAINT "pir_allocations_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pir_advances" ADD CONSTRAINT "pir_advances_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "closure_protocols" ADD CONSTRAINT "closure_protocols_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidation_payouts" ADD CONSTRAINT "liquidation_payouts_closureId_fkey" FOREIGN KEY ("closureId") REFERENCES "closure_protocols"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidation_payouts" ADD CONSTRAINT "liquidation_payouts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dormancy_vaults" ADD CONSTRAINT "dormancy_vaults_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dormancy_vaults" ADD CONSTRAINT "dormancy_vaults_ownershipId_fkey" FOREIGN KEY ("ownershipId") REFERENCES "ownerships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dormancy_auctions" ADD CONSTRAINT "dormancy_auctions_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "dormancy_vaults"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dormancy_auctions" ADD CONSTRAINT "dormancy_auctions_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agora_suggestions" ADD CONSTRAINT "agora_suggestions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agora_suggestion_votes" ADD CONSTRAINT "agora_suggestion_votes_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "agora_suggestions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agora_suggestion_votes" ADD CONSTRAINT "agora_suggestion_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agora_qas" ADD CONSTRAINT "agora_qas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eighth_ledger_updates" ADD CONSTRAINT "eighth_ledger_updates_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sovereign_stream_posts" ADD CONSTRAINT "sovereign_stream_posts_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sovereign_stream_posts" ADD CONSTRAINT "sovereign_stream_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sovereign_stream_posts" ADD CONSTRAINT "sovereign_stream_posts_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sovereign_stream_posts" ADD CONSTRAINT "sovereign_stream_posts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "sovereign_stream_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_items" ADD CONSTRAINT "marketplace_items_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_items" ADD CONSTRAINT "marketplace_items_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_orders" ADD CONSTRAINT "inventory_orders_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_orders" ADD CONSTRAINT "inventory_orders_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownership_listings" ADD CONSTRAINT "ownership_listings_ownershipId_fkey" FOREIGN KEY ("ownershipId") REFERENCES "ownerships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownership_listings" ADD CONSTRAINT "ownership_listings_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownership_listings" ADD CONSTRAINT "ownership_listings_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownership_listings" ADD CONSTRAINT "ownership_listings_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hall_contributions" ADD CONSTRAINT "hall_contributions_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hall_contributions" ADD CONSTRAINT "hall_contributions_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "users"("ledgerId") ON DELETE CASCADE ON UPDATE CASCADE;

