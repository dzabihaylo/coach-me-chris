import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { encryptSecret, decryptSecret } from "@/lib/crypto";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      granolaApiKey: true,
      createdAt: true,
    },
  });

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json({
    name: user.name,
    email: user.email,
    image: user.image,
    createdAt: user.createdAt,
    hasGranolaKey: !!user.granolaApiKey,
    granolaKeyPrefix: user.granolaApiKey
      ? decryptSecret(user.granolaApiKey).slice(0, 8) + "..."
      : null,
  });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  // Handle name update
  if (body.name !== undefined) {
    const name =
      body.name && typeof body.name === "string" && body.name.trim()
        ? body.name.trim().slice(0, 100)
        : null;
    updates.name = name;
  }

  // Handle Granola API key update
  if (body.granolaApiKey !== undefined) {
    const key =
      body.granolaApiKey &&
      typeof body.granolaApiKey === "string" &&
      body.granolaApiKey.trim()
        ? body.granolaApiKey.trim()
        : null;
    updates.granolaApiKey = key ? encryptSecret(key) : null;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }

  await db.user.update({
    where: { id: session.user.id },
    data: updates,
  });

  return Response.json({ ok: true });
}
