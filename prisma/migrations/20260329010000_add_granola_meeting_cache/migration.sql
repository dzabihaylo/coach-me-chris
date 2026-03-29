-- CreateTable: GranolaMeeting
CREATE TABLE "GranolaMeeting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "participants" TEXT NOT NULL DEFAULT '[]',
    "transcript" TEXT,
    "durationMinutes" INTEGER,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewId" TEXT
);

CREATE INDEX "GranolaMeeting_date_idx" ON "GranolaMeeting"("date");
