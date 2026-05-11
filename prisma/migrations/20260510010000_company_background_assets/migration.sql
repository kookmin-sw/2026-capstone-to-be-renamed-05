ALTER TYPE "AssetPurpose" ADD VALUE 'COMPANY_BACKGROUND';

ALTER TABLE "Company"
  ADD COLUMN "backgroundAssetId" TEXT;

CREATE UNIQUE INDEX "Company_backgroundAssetId_key" ON "Company"("backgroundAssetId");

ALTER TABLE "Company"
  ADD CONSTRAINT "Company_backgroundAssetId_fkey"
  FOREIGN KEY ("backgroundAssetId") REFERENCES "Asset"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
