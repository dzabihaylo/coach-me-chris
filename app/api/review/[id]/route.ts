import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const review = await db.callReview.findUnique({ where: { id, userId: session.user.id } });
  if (!review) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ review });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await db.callReview.findUnique({ where: { id, userId: session.user.id } });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
  await db.callReview.delete({ where: { id, userId: session.user.id } });
  return Response.json({ success: true });
}
