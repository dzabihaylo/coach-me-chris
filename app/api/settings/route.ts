import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { granolaApiKey: true },
  });

  return Response.json({
    hasGranolaKey: !!user?.granolaApiKey,
    // Don't return the actual key — just whether it's set
    granolaKeyPrefix: user?.granolaApiKey
      ? user.granolaApiKey.slice(0, 8) + "..."
      : null,
  });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { granolaApiKey } = await req.json();

  if (granolaApiKey !== undefined) {
    // Allow null/empty to clear the key
    const key = granolaApiKey && typeof granolaApiKey === "string" && granolaApiKey.trim()
      ? granolaApiKey.trim()
      : null;

    await db.user.update({
      where: { id: session.user.id },
      data: { granolaApiKey: key },
    });
  }

  return Response.json({ ok: true });
}
