import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const review = await db.callReview.findUnique({ where: { id } });
  if (!review) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ review });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.callReview.delete({ where: { id } });
  return Response.json({ success: true });
}
