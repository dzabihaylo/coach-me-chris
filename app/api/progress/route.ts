import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const reviews = await db.callReview.findMany({
    where: { userId },
    orderBy: { callDate: "asc" },
    select: {
      id: true,
      title: true,
      callDate: true,
      overallScore: true,
      tacticalEmpathy: true,
      mirroring: true,
      labeling: true,
      calibratedQuestions: true,
      thatsRight: true,
      usingNo: true,
      accusationAudit: true,
      lossFraming: true,
      ackermanBargaining: true,
      blackSwanDiscovery: true,
    },
  });

  const practiceSessions = await db.practiceSession.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      drillType: true,
      score: true,
      rounds: true,
      createdAt: true,
    },
  });

  // Compute averages and trends
  const totalCalls = reviews.length;
  const avgOverall =
    totalCalls > 0
      ? reviews.reduce((s, r) => s + r.overallScore, 0) / totalCalls
      : 0;

  const dimensionAverages = {
    tacticalEmpathy: avg(reviews, "tacticalEmpathy"),
    mirroring: avg(reviews, "mirroring"),
    labeling: avg(reviews, "labeling"),
    calibratedQuestions: avg(reviews, "calibratedQuestions"),
    thatsRight: avg(reviews, "thatsRight"),
    usingNo: avg(reviews, "usingNo"),
    accusationAudit: avg(reviews, "accusationAudit"),
    lossFraming: avg(reviews, "lossFraming"),
    ackermanBargaining: avg(reviews, "ackermanBargaining"),
    blackSwanDiscovery: avg(reviews, "blackSwanDiscovery"),
  };

  // Find weakest dimension
  const weakest = Object.entries(dimensionAverages).sort(
    ([, a], [, b]) => a - b
  )[0];

  return Response.json({
    totalCalls,
    avgOverall,
    dimensionAverages,
    weakest: { key: weakest?.[0], score: weakest?.[1] },
    callHistory: reviews,
    practiceSessions,
    totalPracticeSessions: practiceSessions.length,
  });
}

function avg(
  arr: { [key: string]: unknown }[],
  key: string
): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, r) => s + ((r[key] as number) || 0), 0) / arr.length;
}
