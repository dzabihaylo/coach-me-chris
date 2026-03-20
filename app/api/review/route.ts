import { NextRequest } from "next/server";
import { anthropic, AFTER_ACTION_REVIEW_PROMPT } from "@/lib/claude";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { title, callDate, transcriptText, granolaId, durationMinutes } =
    await req.json();

  if (!transcriptText || transcriptText.trim().length < 50) {
    return Response.json(
      { error: "Transcript too short for analysis" },
      { status: 400 }
    );
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      system: AFTER_ACTION_REVIEW_PROMPT,
      messages: [
        {
          role: "user",
          content: `Call Title: ${title || "Untitled Call"}\n\nTranscript:\n\n${transcriptText}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const raw = content.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const feedback = JSON.parse(raw);
    const d = feedback.dimensionDetails;

    const review = await db.callReview.create({
      data: {
        title: title || "Untitled Call",
        callDate: callDate ? new Date(callDate) : new Date(),
        transcriptText,
        granolaId: granolaId || null,
        durationMinutes: durationMinutes || null,
        tacticalEmpathy: d.tacticalEmpathy?.score ?? 0,
        mirroring: d.mirroring?.score ?? 0,
        labeling: d.labeling?.score ?? 0,
        calibratedQuestions: d.calibratedQuestions?.score ?? 0,
        thatsRight: d.thatsRight?.score ?? 0,
        usingNo: d.usingNo?.score ?? 0,
        accusationAudit: d.accusationAudit?.score ?? 0,
        lossFraming: d.lossFraming?.score ?? 0,
        ackermanBargaining: d.ackermanBargaining?.score ?? 0,
        blackSwanDiscovery: d.blackSwanDiscovery?.score ?? 0,
        overallScore: feedback.overallScore ?? 0,
        feedbackJson: JSON.stringify(feedback),
      },
    });

    return Response.json({ review, feedback });
  } catch (err) {
    console.error("Review error:", err);
    return Response.json({ error: "Analysis failed" }, { status: 500 });
  }
}

export async function GET() {
  const reviews = await db.callReview.findMany({
    orderBy: { callDate: "desc" },
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
      durationMinutes: true,
      createdAt: true,
    },
  });
  return Response.json({ reviews });
}
