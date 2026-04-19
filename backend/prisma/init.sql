PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "User" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "githubId" TEXT NOT NULL,
  "login" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT,
  "avatarUrl" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_githubId_key" ON "User"("githubId");

CREATE TABLE IF NOT EXISTS "OAuthAccount" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "userId" INTEGER NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'GITHUB',
  "accessToken" TEXT NOT NULL,
  "scope" TEXT,
  "tokenType" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "OAuthAccount_userId_provider_key" ON "OAuthAccount"("userId", "provider");

CREATE TABLE IF NOT EXISTS "ConnectedRepository" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "userId" INTEGER NOT NULL,
  "githubRepoId" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "owner" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "defaultBranch" TEXT,
  "isPrivate" BOOLEAN NOT NULL DEFAULT false,
  "lastSyncedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ConnectedRepository_userId_fullName_key" ON "ConnectedRepository"("userId", "fullName");

CREATE TABLE IF NOT EXISTS "WorkItem" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "repositoryId" INTEGER NOT NULL,
  "githubIssueId" TEXT NOT NULL,
  "githubNodeId" TEXT,
  "number" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "state" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "labels" TEXT,
  "authorLogin" TEXT,
  "createdAtOnGitHub" DATETIME,
  "updatedAtOnGitHub" DATETIME,
  "lastSyncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("repositoryId") REFERENCES "ConnectedRepository"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "WorkItem_repositoryId_type_number_key" ON "WorkItem"("repositoryId", "type", "number");

CREATE TABLE IF NOT EXISTS "AnalysisResult" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "repositoryId" INTEGER NOT NULL,
  "workItemId" INTEGER NOT NULL,
  "priority" TEXT NOT NULL,
  "priorityReason" TEXT NOT NULL,
  "labelRecommendations" TEXT,
  "analyzedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("repositoryId") REFERENCES "ConnectedRepository"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "AnalysisResult_workItemId_key" ON "AnalysisResult"("workItemId");
CREATE INDEX IF NOT EXISTS "AnalysisResult_repositoryId_priority_idx" ON "AnalysisResult"("repositoryId", "priority");

CREATE TABLE IF NOT EXISTS "DuplicateGroup" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "repositoryId" INTEGER NOT NULL,
  "groupKey" TEXT NOT NULL,
  "similarity" REAL NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("repositoryId") REFERENCES "ConnectedRepository"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "DuplicateGroup_repositoryId_groupKey_key" ON "DuplicateGroup"("repositoryId", "groupKey");

CREATE TABLE IF NOT EXISTS "DuplicateGroupItem" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "groupId" INTEGER NOT NULL,
  "workItemId" INTEGER NOT NULL,
  FOREIGN KEY ("groupId") REFERENCES "DuplicateGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "DuplicateGroupItem_groupId_workItemId_key" ON "DuplicateGroupItem"("groupId", "workItemId");

CREATE TABLE IF NOT EXISTS "SyncJob" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "userId" INTEGER NOT NULL,
  "repositoryId" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "totalPages" INTEGER,
  "processedPages" INTEGER NOT NULL DEFAULT 0,
  "totalFetched" INTEGER NOT NULL DEFAULT 0,
  "openCount" INTEGER NOT NULL DEFAULT 0,
  "closedCount" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  "startedAt" DATETIME,
  "finishedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("repositoryId") REFERENCES "ConnectedRepository"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SyncJob_repositoryId_createdAt_idx" ON "SyncJob"("repositoryId", "createdAt");
CREATE INDEX IF NOT EXISTS "SyncJob_userId_createdAt_idx" ON "SyncJob"("userId", "createdAt");
