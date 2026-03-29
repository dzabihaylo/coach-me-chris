import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { safeJsonParse } from "@/lib/safe-json";

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
      const nudges = safeJsonParse<unknown[]>(session.nudgesJson, []);
      nudges.push({ nudge, timestamp: new Date().toISOString() });
      await db.liveSession.update({
        where: { id: sessionId },
        data: { nudgesJson: JSON.stringify(nudges) },
      });
      return Response.json({ ok: true });
    }

    if (action === "end" && sessionId) {
      const snippetText = typeof transcript === "string" ? transcript.slice(0, 50_000) : "";
      const updated = await db.liveSession.update({
        where: { id: sessionId, userId },
        data: {
          endedAt: new Date(),
          transcriptSnippets: snippetText
            ? JSON.stringify([snippetText])
            : undefined,
        },
      });
      return Response.json({ session: updated });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[live-session]", message);
    return Response.json({ error: "Session operation failed" }, { status: 500 });
  }
}
