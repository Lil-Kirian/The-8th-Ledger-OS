CREATE TYPE "UserRole" AS ENUM ('user', 'architech', 'scribe', 'warden');
CREATE TYPE "KycStatus" AS ENUM ('unverified', 'pending', 'approved', 'rejected');
CREATE TYPE "KycTier" AS ENUM ('visitor', 'sovereign', 'verified', 'whale');
CREATE TYPE "HallRoleType" AS ENUM ('manager', 'liaison', 'speaker', 'treasurer', 'warden', 'scribe', 'member');

ALTER TABLE "users"
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "UserRole"
    USING (
      CASE
        WHEN "role" IN ('architech', 'admin', 'founder') THEN 'architech'
        WHEN "role" IN ('scribe', 'warden') THEN "role"
        ELSE 'user'
      END
    )::"UserRole",
  ALTER COLUMN "role" SET DEFAULT 'user';

ALTER TABLE "users"
  ALTER COLUMN "kycStatus" DROP DEFAULT,
  ALTER COLUMN "kycStatus" TYPE "KycStatus"
    USING (
      CASE
        WHEN "kycStatus" IN ('approved', 'verified') THEN 'approved'
        WHEN "kycStatus" IN ('rejected', 'declined') THEN 'rejected'
        WHEN "kycStatus" = 'pending' THEN 'pending'
        ELSE 'unverified'
      END
    )::"KycStatus",
  ALTER COLUMN "kycStatus" SET DEFAULT 'unverified';

ALTER TABLE "users"
  ALTER COLUMN "kycTier" DROP DEFAULT,
  ALTER COLUMN "kycTier" TYPE "KycTier"
    USING (
      CASE
        WHEN "kycTier" IN ('sovereign', 'verified', 'whale') THEN "kycTier"
        ELSE 'visitor'
      END
    )::"KycTier",
  ALTER COLUMN "kycTier" SET DEFAULT 'visitor';

ALTER TABLE "user_identities"
  ALTER COLUMN "kycStatus" DROP DEFAULT,
  ALTER COLUMN "kycStatus" TYPE "KycStatus"
    USING (
      CASE
        WHEN "kycStatus" IN ('approved', 'verified') THEN 'approved'
        WHEN "kycStatus" IN ('rejected', 'declined') THEN 'rejected'
        WHEN "kycStatus" = 'pending' THEN 'pending'
        ELSE 'unverified'
      END
    )::"KycStatus",
  ALTER COLUMN "kycStatus" SET DEFAULT 'unverified';

ALTER TABLE "kyc_records"
  ALTER COLUMN "tier" DROP DEFAULT,
  ALTER COLUMN "tier" TYPE "KycTier"
    USING (
      CASE
        WHEN "tier" IN ('sovereign', 'verified', 'whale') THEN "tier"
        ELSE 'visitor'
      END
    )::"KycTier",
  ALTER COLUMN "tier" SET DEFAULT 'visitor';

ALTER TABLE "kyc_records"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "KycStatus"
    USING (
      CASE
        WHEN "status" IN ('approved', 'verified') THEN 'approved'
        WHEN "status" IN ('rejected', 'declined') THEN 'rejected'
        WHEN "status" = 'pending' THEN 'pending'
        ELSE 'unverified'
      END
    )::"KycStatus",
  ALTER COLUMN "status" SET DEFAULT 'pending';

ALTER TABLE "hall_roles"
  ALTER COLUMN "role" TYPE "HallRoleType"
    USING (
      CASE
        WHEN "role" IN ('manager', 'liaison', 'speaker', 'treasurer', 'warden', 'scribe', 'member') THEN "role"
        ELSE 'member'
      END
    )::"HallRoleType";

ALTER TABLE "ownerships"
  ALTER COLUMN "role" TYPE "HallRoleType"
    USING (
      CASE
        WHEN "role" IS NULL THEN NULL
        WHEN "role" IN ('manager', 'liaison', 'speaker', 'treasurer', 'warden', 'scribe', 'member') THEN "role"
        ELSE 'member'
      END
    )::"HallRoleType";
