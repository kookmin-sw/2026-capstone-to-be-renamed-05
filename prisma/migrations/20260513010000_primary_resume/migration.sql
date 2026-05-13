-- AlterTable
ALTER TABLE "Resume" ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Resume_userId_isPrimary_idx" ON "Resume"("userId", "isPrimary");
