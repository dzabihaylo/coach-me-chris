-- CreateTable: AuditLog
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "target" TEXT,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- Add composite index for common query pattern
CREATE INDEX "CallReview_userId_callDate_idx" ON "CallReview"("userId", "callDate");
