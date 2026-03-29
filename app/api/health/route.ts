import { db } from "@/lib/db";

export async function GET() {
  try {
    const userCount = await db.user.count();
    return Response.json({
      status: "ok",
      database: "connected",
      userCount,
    });
  } catch (e) {
    return Response.json(
      {
        status: "error",
        error: String(e),
        dbUrl: (process.env.DATABASE_URL ?? "").substring(0, 25),
      },
      { status: 500 }
    );
  }
}
