import { db } from "@/lib/db";

export async function GET() {
  try {
    const userCount = await db.user.count();
    return Response.json({
      status: "ok",
      database: "connected",
      userCount,
      dbUrl: (process.env.DATABASE_URL ?? "").substring(0, 20) + "...",
    });
  } catch (e) {
    return Response.json(
      {
        status: "error",
        database: "failed",
        error: String(e),
        dbUrl: (process.env.DATABASE_URL ?? "").substring(0, 20) + "...",
      },
      { status: 500 }
    );
  }
}
