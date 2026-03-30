import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rating, comment, context, sessionId } = await req.json();

  if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
    return Response.json({ error: "Rating must be 1-5" }, { status: 400 });
  }

  if (!context || typeof context !== "string") {
    return Response.json({ error: "Context is required" }, { status: 400 });
  }

  const entry = await db.userFeedback.create({
    data: {
      userId: session.user.id,
      rating,
      comment: comment && typeof comment === "string" ? comment.trim().slice(0, 2000) : null,
      context: context.slice(0, 100),
      sessionId: sessionId && typeof sessionId === "string" ? sessionId : null,
    },
  });

  return Response.json({ id: entry.id }, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const feedback = await db.userFeedback.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return Response.json({ feedback });
}
