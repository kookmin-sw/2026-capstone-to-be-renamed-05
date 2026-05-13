ALTER TYPE "AssetPurpose" ADD VALUE 'USER_PROFILE_IMAGE';

ALTER TABLE "User"
  ADD COLUMN "profileImageAssetId" TEXT;

ALTER TABLE "Asset"
  ALTER COLUMN "companyId" DROP NOT NULL;

CREATE UNIQUE INDEX "User_profileImageAssetId_key"
  ON "User"("profileImageAssetId");

ALTER TABLE "User"
  ADD CONSTRAINT "User_profileImageAssetId_fkey"
  FOREIGN KEY ("profileImageAssetId") REFERENCES "Asset"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
