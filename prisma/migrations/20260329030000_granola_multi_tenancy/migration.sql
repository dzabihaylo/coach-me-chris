-- Add userId to GranolaMeeting for multi-tenancy
ALTER TABLE "GranolaMeeting" ADD COLUMN "userId" TEXT REFERENCES "User"("id") ON DELETE CASCADE;

CREATE INDEX "GranolaMeeting_userId_idx" ON "GranolaMeeting"("userId");
