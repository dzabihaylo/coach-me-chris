import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const authSession = await auth();
  if (!authSession?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = authSession.user.id;

  try {
    const { action, sessionId, nudge, transcript } = await req.json();

    if (action === "start") {
      const session = await db.liveSession.create({ data: { userId } });
      return Response.json({ sessionId: session.id });
    }

    if (action === "nudge" && sessionId && nudge) {
      const session = await db.liveSession.findUnique({
        where: { id: sessionId, userId },
      });
      if (!session)
        return Response.json({ error: "Not found" }, { status: 404 });
      const nudges = JSON.parse(session.nudgesJson);
      nudges.push({ nudge, timestamp: new Date().toISOString() });
      await db.liveSession.update({
        where: { id: sessionId },
        data: { nudgesJson: JSON.stringify(nudges) },
      });
      return Response.json({ ok: true });
    }

    if (action === "end" && sessionId) {
      const updated = await db.liveSession.update({
        where: { id: sessionId, userId },
        data: {
          endedAt: new Date(),
          transcriptSnippets: transcript
            ? JSON.stringify([transcript])
            : undefined,
        },
      });
      return Response.json({ session: updated });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[live-session] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
