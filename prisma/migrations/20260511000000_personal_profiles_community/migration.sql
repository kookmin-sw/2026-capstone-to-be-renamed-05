-- CreateEnum
CREATE TYPE "CpaVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'CPA_VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PersonalCareerStage" AS ENUM ('CPA_UNPLACED', 'TRAINEE', 'LICENSED_CPA');

-- CreateEnum
CREATE TYPE "EmploymentHistoryStatus" AS ENUM ('UNKNOWN', 'NONE', 'HAS_EMPLOYMENT');

-- CreateEnum
CREATE TYPE "PersonalVerificationRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CommunityBoardType" AS ENUM ('CPA_PREP', 'TRAINEE', 'SENIOR', 'FREE');

-- CreateEnum
CREATE TYPE "CommunityPostStatus" AS ENUM ('QUESTION', 'ANSWERED', 'FREE', 'INFO');

-- CreateTable
CREATE TABLE "PersonalProfile" (
    "userId" TEXT NOT NULL,
    "cpaVerificationStatus" "CpaVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "careerStage" "PersonalCareerStage",
    "employmentHistoryStatus" "EmploymentHistoryStatus" NOT NULL DEFAULT 'UNKNOWN',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "PersonalVerificationRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "birthDate" TEXT,
    "registrationNumber" TEXT,
    "registrationNumberLast4" TEXT,
    "requestedCareerStage" "PersonalCareerStage" NOT NULL,
    "status" "PersonalVerificationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalVerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityPost" (
    "id" TEXT NOT NULL,
    "boardType" "CommunityBoardType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "CommunityPostStatus" NOT NULL DEFAULT 'QUESTION',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "authorId" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "acceptedAnswerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityAnswer" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PersonalProfile_cpaVerificationStatus_idx" ON "PersonalProfile"("cpaVerificationStatus");

-- CreateIndex
CREATE INDEX "PersonalProfile_careerStage_idx" ON "PersonalProfile"("careerStage");

-- CreateIndex
CREATE INDEX "PersonalVerificationRequest_userId_status_idx" ON "PersonalVerificationRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "PersonalVerificationRequest_status_createdAt_idx" ON "PersonalVerificationRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityPost_boardType_createdAt_idx" ON "CommunityPost"("boardType", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityPost_authorId_createdAt_idx" ON "CommunityPost"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityAnswer_postId_createdAt_idx" ON "CommunityAnswer"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityAnswer_authorId_createdAt_idx" ON "CommunityAnswer"("authorId", "createdAt");

-- AddForeignKey
ALTER TABLE "PersonalProfile" ADD CONSTRAINT "PersonalProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalVerificationRequest" ADD CONSTRAINT "PersonalVerificationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalVerificationRequest" ADD CONSTRAINT "PersonalVerificationRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityAnswer" ADD CONSTRAINT "CommunityAnswer_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityAnswer" ADD CONSTRAINT "CommunityAnswer_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
