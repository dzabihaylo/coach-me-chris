import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 300; // 5 minutes — long recordings take time

interface DeepgramWord {
  word: string;
  speaker: number;
  start: number;
  end: number;
}

interface DeepgramUtterance {
  speaker: number;
  transcript: string;
  start: number;
  end: number;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed } = rateLimit(session.user.id, 5, 60_000);
  if (!allowed) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Transcription service not configured" }, { status: 503 });
  }

  const { url } = await req.json();
  if (!url || typeof url !== "string") {
    return Response.json({ error: "url is required" }, { status: 400 });
  }

  try {
    const dgResponse = await fetch(
      "https://api.deepgram.com/v1/listen?" +
        new URLSearchParams({
          model: "nova-2",
          smart_format: "true",
          diarize: "true",
          utterances: "true",
          punctuate: "true",
          paragraphs: "true",
        }),
      {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      }
    );

    if (!dgResponse.ok) {
      const errText = await dgResponse.text();
      console.error("[transcribe] Deepgram error:", dgResponse.status, errText);
      return Response.json(
        { error: `Transcription failed (${dgResponse.status})` },
        { status: 502 }
      );
    }

    const data = await dgResponse.json();
    const results = data.results;

    // Build speaker-labeled transcript from utterances
    const utterances: DeepgramUtterance[] = results?.utterances ?? [];
    let transcript: string;

    if (utterances.length > 0) {
      // Use utterances for speaker-labeled output
      const speakerNames = new Map<number, string>();
      const speakerOrder: number[] = [];
      for (const u of utterances) {
        if (!speakerNames.has(u.speaker)) {
          speakerOrder.push(u.speaker);
          speakerNames.set(
            u.speaker,
            speakerOrder.length === 1 ? "Speaker 1" : `Speaker ${speakerOrder.length}`
          );
        }
      }

      transcript = utterances
        .map((u) => `${speakerNames.get(u.speaker)}: ${u.transcript}`)
        .join("\n\n");
    } else {
      // Fallback: plain transcript without speakers
      const channels = results?.channels ?? [];
      transcript = channels[0]?.alternatives?.[0]?.transcript ?? "";
    }

    // Extract metadata
    const metadata = data.metadata ?? {};
    const durationSeconds = metadata.duration ?? 0;
    const durationMinutes = Math.round(durationSeconds / 60);

    // Count unique speakers
    const speakers = new Set(utterances.map((u: DeepgramUtterance) => u.speaker));

    return Response.json({
      transcript,
      durationMinutes,
      speakerCount: speakers.size,
      wordCount: (results?.channels?.[0]?.alternatives?.[0]?.words as DeepgramWord[])?.length ?? 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[transcribe]", message);
    return Response.json({ error: "Transcription failed" }, { status: 500 });
  }
}
