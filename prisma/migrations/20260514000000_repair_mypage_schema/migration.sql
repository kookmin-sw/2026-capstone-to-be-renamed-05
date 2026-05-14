-- Repair environments where earlier mypage migrations were recorded but the
-- underlying table/column changes were not present.

CREATE TABLE IF NOT EXISTS "Resume" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Resume" ADD COLUMN IF NOT EXISTS "isPrimary" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "JobFitAnalysis" (
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

CREATE UNIQUE INDEX IF NOT EXISTS "JobFitAnalysis_userId_jobId_resumeId_key" ON "JobFitAnalysis"("userId", "jobId", "resumeId");
CREATE INDEX IF NOT EXISTS "JobFitAnalysis_userId_fitScore_createdAt_idx" ON "JobFitAnalysis"("userId", "fitScore", "createdAt");
CREATE INDEX IF NOT EXISTS "JobFitAnalysis_jobId_createdAt_idx" ON "JobFitAnalysis"("jobId", "createdAt");
CREATE INDEX IF NOT EXISTS "Resume_userId_createdAt_idx" ON "Resume"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Resume_userId_isPrimary_idx" ON "Resume"("userId", "isPrimary");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'Resume_userId_fkey'
          AND connamespace = current_schema()::regnamespace
    ) THEN
        ALTER TABLE "Resume"
            ADD CONSTRAINT "Resume_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'JobFitAnalysis_userId_fkey'
          AND connamespace = current_schema()::regnamespace
    ) THEN
        ALTER TABLE "JobFitAnalysis"
            ADD CONSTRAINT "JobFitAnalysis_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'JobFitAnalysis_jobId_fkey'
          AND connamespace = current_schema()::regnamespace
    ) THEN
        ALTER TABLE "JobFitAnalysis"
            ADD CONSTRAINT "JobFitAnalysis_jobId_fkey"
            FOREIGN KEY ("jobId") REFERENCES "Job"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'JobFitAnalysis_resumeId_fkey'
          AND connamespace = current_schema()::regnamespace
    ) THEN
        ALTER TABLE "JobFitAnalysis"
            ADD CONSTRAINT "JobFitAnalysis_resumeId_fkey"
            FOREIGN KEY ("resumeId") REFERENCES "Resume"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
