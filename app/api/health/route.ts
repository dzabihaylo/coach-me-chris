import { db } from "@/lib/db";

export async function GET() {
  try {
    // Query confirms DB reachability; the count itself is not returned
    // (this route is public — don't leak user counts).
    await db.user.count();
    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "error" }, { status: 500 });
  }
}
