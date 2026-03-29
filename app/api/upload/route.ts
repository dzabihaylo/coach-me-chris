import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 300; // 5 minutes for large files

const ALLOWED_TYPES = [
  "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/webm",
  "audio/ogg", "audio/mp4", "audio/x-m4a", "audio/m4a",
  "video/mp4", "video/webm", "video/quicktime",
];

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

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

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json(
      { error: `Unsupported file type: ${file.type}. Accepted: mp3, wav, m4a, mp4, webm, ogg, mov` },
      { status: 400 }
    );
  }

  try {
    // Stream file directly to Deepgram — no intermediate storage needed
    const fileBuffer = await file.arrayBuffer();

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
          "Content-Type": file.type,
        },
        body: fileBuffer,
      }
    );

    if (!dgResponse.ok) {
      const errText = await dgResponse.text();
      console.error("[upload] Deepgram error:", dgResponse.status, errText);
      return Response.json(
        { error: `Transcription failed (${dgResponse.status})` },
        { status: 502 }
      );
    }

    const data = await dgResponse.json();
    const results = data.results;

    // Build speaker-labeled transcript from utterances
    interface Utterance { speaker: number; transcript: string }
    const utterances: Utterance[] = results?.utterances ?? [];
    let transcript: string;

    if (utterances.length > 0) {
      const speakerNames = new Map<number, string>();
      const speakerOrder: number[] = [];
      for (const u of utterances) {
        if (!speakerNames.has(u.speaker)) {
          speakerOrder.push(u.speaker);
          speakerNames.set(u.speaker, `Speaker ${speakerOrder.length}`);
        }
      }
      transcript = utterances
        .map((u) => `${speakerNames.get(u.speaker)}: ${u.transcript}`)
        .join("\n\n");
    } else {
      transcript = results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
    }

    const durationSeconds = data.metadata?.duration ?? 0;
    const speakers = new Set(utterances.map((u: Utterance) => u.speaker));

    return Response.json({
      transcript,
      durationMinutes: Math.round(durationSeconds / 60),
      speakerCount: speakers.size,
      wordCount: results?.channels?.[0]?.alternatives?.[0]?.words?.length ?? 0,
      filename: file.name,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[upload]", message);
    return Response.json({ error: "Upload and transcription failed" }, { status: 500 });
  }
}
