-- CreateTable
CREATE TABLE "CallReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "callDate" DATETIME NOT NULL,
    "transcriptText" TEXT NOT NULL,
    "granolaId" TEXT,
    "durationMinutes" INTEGER,
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
    "coachingNotes" TEXT
);

-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "drillType" TEXT NOT NULL,
    "score" REAL NOT NULL DEFAULT 0,
    "rounds" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "sessionJson" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "LiveSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "nudgesJson" TEXT NOT NULL DEFAULT '[]',
    "transcriptSnippets" TEXT NOT NULL DEFAULT '[]'
);

-- CreateIndex
CREATE INDEX "CallReview_callDate_idx" ON "CallReview"("callDate");
