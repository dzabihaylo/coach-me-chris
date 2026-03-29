export async function GET() {
  const url = process.env.DATABASE_URL ?? "";
  const token = process.env.DATABASE_AUTH_TOKEN ?? "";

  try {
    // Test raw libsql connection first
    const { PrismaClient } = await import("@prisma/client");
    const { PrismaLibSql } = await import("@prisma/adapter-libsql");

    const adapter = new PrismaLibSql({ url, authToken: token });
    const origUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "file:./prisma/dev.db";
    const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
    process.env.DATABASE_URL = origUrl;
    const userCount = await prisma.user.count();

    return Response.json({
      status: "ok",
      database: "connected",
      userCount,
      urlPrefix: url.substring(0, 25),
      hasToken: token.length > 0,
    });
  } catch (e) {
    return Response.json(
      {
        status: "error",
        error: String(e),
        urlPrefix: url.substring(0, 25),
        hasToken: token.length > 0,
      },
      { status: 500 }
    );
  }
}
