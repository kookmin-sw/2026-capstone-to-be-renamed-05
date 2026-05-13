-- CreateEnum
CREATE TYPE "JobEngagementEventType" AS ENUM ('DETAIL_VIEW', 'ORIGINAL_CLICK', 'BOOKMARK_ADDED', 'BOOKMARK_REMOVED');

-- CreateTable
CREATE TABLE "JobEngagementEvent" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "JobEngagementEventType" NOT NULL,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobEngagementEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobEngagementEvent_companyId_createdAt_idx" ON "JobEngagementEvent"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "JobEngagementEvent_jobId_type_createdAt_idx" ON "JobEngagementEvent"("jobId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "JobEngagementEvent_actorUserId_createdAt_idx" ON "JobEngagementEvent"("actorUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "JobEngagementEvent" ADD CONSTRAINT "JobEngagementEvent_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobEngagementEvent" ADD CONSTRAINT "JobEngagementEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobEngagementEvent" ADD CONSTRAINT "JobEngagementEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
