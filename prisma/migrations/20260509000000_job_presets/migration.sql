-- CreateTable
CREATE TABLE "CompanyMetadata" (
    "companyId" TEXT NOT NULL,
    "careerVerificationSignals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "careerVerificationNote" TEXT,
    "careerVerificationSource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyMetadata_pkey" PRIMARY KEY ("companyId")
);

-- CreateTable
CREATE TABLE "UserJobPreset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filterState" JSONB NOT NULL,
    "autoLabel" TEXT NOT NULL,
    "filterSignature" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "UserJobPreset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserJobPreset_userId_filterSignature_key" ON "UserJobPreset"("userId", "filterSignature");

-- CreateIndex
CREATE INDEX "UserJobPreset_userId_createdAt_idx" ON "UserJobPreset"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "CompanyMetadata" ADD CONSTRAINT "CompanyMetadata_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserJobPreset" ADD CONSTRAINT "UserJobPreset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
