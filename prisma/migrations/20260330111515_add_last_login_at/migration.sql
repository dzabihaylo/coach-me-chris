/*
  Warnings:

  - The primary key for the `Session` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "AllowedEmail" ADD COLUMN "lastLoginAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CallReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "callDate" DATETIME NOT NULL,
    "transcriptText" TEXT NOT NULL,
    "granolaId" TEXT,
    "durationMinutes" INTEGER,
    "userId" TEXT,
    "tacticalEmpathy" REAL NOT NULL DEFAULT 0,
    "mirroring" REAL NOT NULL DEFAULT 0,
    "labeling" REAL NOT NULL DEFAULT 0,
    "calibratedQuestions" REAL NOT NULL DEFAULT 0,
    "thatsRight" REAL NOT NULL DEFAULT 0,
    "usingNo" REAL NOT NULL DEFAULT 0,
    "accusationAudit" REAL NOT NULL DEFAULT 0,
    "lossFraming" REAL NOT NULL DEFAULT 0,
    "ackermanBargaining" REAL NOT NULL DEFAULT 0,
    "blackSwanDiscovery" REAL NOT NULL DEFAULT 0,
    "overallScore" REAL NOT NULL DEFAULT 0,
    "feedbackJson" TEXT NOT NULL,
    "coachingNotes" TEXT,
    CONSTRAINT "CallReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CallReview" ("accusationAudit", "ackermanBargaining", "blackSwanDiscovery", "calibratedQuestions", "callDate", "coachingNotes", "createdAt", "durationMinutes", "feedbackJson", "granolaId", "id", "labeling", "lossFraming", "mirroring", "overallScore", "tacticalEmpathy", "thatsRight", "title", "transcriptText", "userId", "usingNo") SELECT "accusationAudit", "ackermanBargaining", "blackSwanDiscovery", "calibratedQuestions", "callDate", "coachingNotes", "createdAt", "durationMinutes", "feedbackJson", "granolaId", "id", "labeling", "lossFraming", "mirroring", "overallScore", "tacticalEmpathy", "thatsRight", "title", "transcriptText", "userId", "usingNo" FROM "CallReview";
DROP TABLE "CallReview";
ALTER TABLE "new_CallReview" RENAME TO "CallReview";
CREATE INDEX "CallReview_callDate_idx" ON "CallReview"("callDate");
CREATE INDEX "CallReview_userId_idx" ON "CallReview"("userId");
CREATE INDEX "CallReview_userId_callDate_idx" ON "CallReview"("userId", "callDate");
CREATE TABLE "new_GranolaMeeting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "participants" TEXT NOT NULL DEFAULT '[]',
    "transcript" TEXT,
    "durationMinutes" INTEGER,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewId" TEXT,
    "userId" TEXT,
    CONSTRAINT "GranolaMeeting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GranolaMeeting" ("date", "durationMinutes", "id", "participants", "reviewId", "syncedAt", "title", "transcript", "userId") SELECT "date", "durationMinutes", "id", "participants", "reviewId", "syncedAt", "title", "transcript", "userId" FROM "GranolaMeeting";
DROP TABLE "GranolaMeeting";
ALTER TABLE "new_GranolaMeeting" RENAME TO "GranolaMeeting";
CREATE INDEX "GranolaMeeting_date_idx" ON "GranolaMeeting"("date");
CREATE INDEX "GranolaMeeting_userId_idx" ON "GranolaMeeting"("userId");
CREATE TABLE "new_LiveSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "nudgesJson" TEXT NOT NULL DEFAULT '[]',
    "transcriptSnippets" TEXT NOT NULL DEFAULT '[]',
    "userId" TEXT,
    CONSTRAINT "LiveSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LiveSession" ("endedAt", "id", "nudgesJson", "startedAt", "transcriptSnippets", "userId") SELECT "endedAt", "id", "nudgesJson", "startedAt", "transcriptSnippets", "userId" FROM "LiveSession";
DROP TABLE "LiveSession";
ALTER TABLE "new_LiveSession" RENAME TO "LiveSession";
CREATE INDEX "LiveSession_userId_idx" ON "LiveSession"("userId");
CREATE TABLE "new_PracticeSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "drillType" TEXT NOT NULL,
    "score" REAL NOT NULL DEFAULT 0,
    "rounds" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "sessionJson" TEXT NOT NULL,
    "userId" TEXT,
    CONSTRAINT "PracticeSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PracticeSession" ("createdAt", "drillType", "id", "notes", "rounds", "score", "sessionJson", "userId") SELECT "createdAt", "drillType", "id", "notes", "rounds", "score", "sessionJson", "userId" FROM "PracticeSession";
DROP TABLE "PracticeSession";
ALTER TABLE "new_PracticeSession" RENAME TO "PracticeSession";
CREATE INDEX "PracticeSession_userId_idx" ON "PracticeSession"("userId");
CREATE TABLE "new_Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Session" ("createdAt", "expires", "sessionToken", "updatedAt", "userId") SELECT "createdAt", "expires", "sessionToken", "updatedAt", "userId" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
