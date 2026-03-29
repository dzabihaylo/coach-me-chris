import { PrismaClient } from "@prisma/client";

function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

  if (url.startsWith("file:")) {
    // Local SQLite — dynamic import to avoid bundling native module on Vercel
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
    const adapter = new PrismaBetterSqlite3({ url });
    return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
  }

  // Remote Turso/libsql
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaLibSql } = require("@prisma/adapter-libsql");
  const adapter = new PrismaLibSql({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  // PrismaClient validates DATABASE_URL even when an adapter is provided.
  // Temporarily set a valid sqlite URL so the constructor doesn't reject libsql://.
  const origUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "file:./prisma/dev.db";
  const client = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
  process.env.DATABASE_URL = origUrl;
  return client;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
