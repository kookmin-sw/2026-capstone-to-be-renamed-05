-- CreateTable
CREATE TABLE "JobFitAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "fitScore" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "companyPriorities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "gaps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recommendation" TEXT NOT NULL,
    "rawJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobFitAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobFitAnalysis_userId_jobId_resumeId_key" ON "JobFitAnalysis"("userId", "jobId", "resumeId");

-- CreateIndex
CREATE INDEX "JobFitAnalysis_userId_fitScore_createdAt_idx" ON "JobFitAnalysis"("userId", "fitScore", "createdAt");

-- CreateIndex
CREATE INDEX "JobFitAnalysis_jobId_createdAt_idx" ON "JobFitAnalysis"("jobId", "createdAt");

-- AddForeignKey
ALTER TABLE "JobFitAnalysis" ADD CONSTRAINT "JobFitAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobFitAnalysis" ADD CONSTRAINT "JobFitAnalysis_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobFitAnalysis" ADD CONSTRAINT "JobFitAnalysis_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
