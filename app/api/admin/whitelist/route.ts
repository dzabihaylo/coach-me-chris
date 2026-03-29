import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const entries = await db.allowedEmail.findMany({
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ entries });
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { email, role } = await req.json();
  if (!email || typeof email !== "string") {
    return Response.json({ error: "Email is required" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const validRole = role === "admin" ? "admin" : "user";

  const existing = await db.allowedEmail.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    return Response.json({ error: "Email already whitelisted" }, { status: 409 });
  }

  const entry = await db.allowedEmail.create({
    data: {
      email: normalizedEmail,
      role: validRole,
      addedBy: session.user?.email ?? "unknown",
    },
  });
  return Response.json({ entry }, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { email } = await req.json();
  if (!email) {
    return Response.json({ error: "Email is required" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Prevent removing yourself
  if (normalizedEmail === session.user?.email?.toLowerCase()) {
    return Response.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  await db.allowedEmail.delete({ where: { email: normalizedEmail } });
  return Response.json({ ok: true });
}
