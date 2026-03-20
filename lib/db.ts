import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import path from "path";

function createPrismaClient() {
  const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
  const libsql = createClient({ url: `file:${dbPath}` });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaLibSql(libsql as any);
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
