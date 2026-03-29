import { db } from "@/lib/db";

export async function GET() {
  try {
    const userCount = await db.user.count();
    return Response.json({ status: "ok", userCount });
  } catch (e) {
    return Response.json(
      { status: "error", error: String(e) },
      { status: 500 }
    );
  }
}
