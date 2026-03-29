-- CreateTable: AllowedEmail
CREATE TABLE "AllowedEmail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedBy" TEXT
);

CREATE UNIQUE INDEX "AllowedEmail_email_key" ON "AllowedEmail"("email");

-- Seed admin user
INSERT INTO "AllowedEmail" ("id", "email", "role", "addedBy")
VALUES ('seed-admin-001', 'dzabihaylo@gmail.com', 'admin', 'system');
