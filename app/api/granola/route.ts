import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";

const GRANOLA_API = "https://public-api.granola.ai/v1";

export const maxDuration = 30;

async function getGranolaKey(userId: string): Promise<string | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { granolaApiKey: true },
  });
  return user?.granolaApiKey ? decryptSecret(user.granolaApiKey) : null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = await getGranolaKey(session.user.id);
  if (!apiKey) {
    return Response.json({
      meetings: [],
      needsApiKey: true,
    });
  }

  try {
    const res = await fetch(`${GRANOLA_API}/notes?created_after=${thirtyDaysAgo()}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    });

    if (res.status === 401 || res.status === 403) {
      return Response.json({
        meetings: [],
        error: "Granola API key is invalid or expired. Update it in Settings.",
        needsApiKey: true,
      });
    }

    if (!res.ok) {
      return Response.json({ meetings: [], error: `Granola API error (${res.status})` });
    }

    const data = await res.json();
    const notes = data.notes ?? data.data ?? [];

    return Response.json({
      meetings: notes.map((n: GranolaNoteListItem) => ({
        id: n.id,
        title: n.title,
        date: n.created_at ?? n.createdAt,
        hasTranscript: true, // API only returns notes with transcripts
        participants: n.attendees?.map((a: { name?: string; email?: string }) => a.name ?? a.email) ?? [],
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[granola]", message);
    return Response.json({ meetings: [], error: "Failed to fetch from Granola" });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { meetingId } = await req.json();
  if (!meetingId || typeof meetingId !== "string") {
    return Response.json({ error: "meetingId required" }, { status: 400 });
  }

  const apiKey = await getGranolaKey(session.user.id);
  if (!apiKey) {
    return Response.json({ error: "Granola API key not configured" }, { status: 400 });
  }

  try {
    const res = await fetch(`${GRANOLA_API}/notes/${meetingId}?include=transcript`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      return Response.json({ error: `Granola API error (${res.status})` }, { status: 502 });
    }

    const note = await res.json();

    // Build transcript from transcript array
    let transcript = "";
    if (Array.isArray(note.transcript)) {
      transcript = note.transcript
        .map((t: { speaker?: string; source?: string; text: string }) => {
          const speaker = t.speaker ?? t.source ?? "Unknown";
          return `${speaker}: ${t.text}`;
        })
        .join("\n\n");
    } else if (typeof note.transcript === "string") {
      transcript = note.transcript;
    }

    return Response.json({
      id: note.id,
      title: note.title,
      date: note.created_at ?? note.createdAt,
      transcript,
      participants: note.attendees?.map((a: { name?: string; email?: string }) => a.name ?? a.email) ?? [],
      durationMinutes: note.duration_minutes ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[granola]", message);
    return Response.json({ error: "Failed to fetch meeting from Granola" }, { status: 500 });
  }
}

function thirtyDaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString();
}

interface GranolaNoteListItem {
  id: string;
  title: string;
  created_at?: string;
  createdAt?: string;
  attendees?: { name?: string; email?: string }[];
}
