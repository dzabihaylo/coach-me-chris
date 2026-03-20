// Granola API integration
// Granola stores meeting notes and transcripts locally at ~/Library/Application Support/Granola

export interface GranolaMeeting {
  id: string;
  title: string;
  date: string;
  duration?: number;
  transcript?: string;
  notes?: string;
}

export async function fetchGranolaMeetings(): Promise<GranolaMeeting[]> {
  const baseUrl = process.env.GRANOLA_API_URL || "http://localhost:3100";
  try {
    const res = await fetch(`${baseUrl}/meetings`, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Granola API error: ${res.status}`);
    const data = await res.json();
    return data.meetings || [];
  } catch {
    return [];
  }
}

export async function fetchGranolaTranscript(
  meetingId: string
): Promise<string | null> {
  const baseUrl = process.env.GRANOLA_API_URL || "http://localhost:3100";
  try {
    const res = await fetch(`${baseUrl}/meetings/${meetingId}/transcript`, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Granola API error: ${res.status}`);
    const data = await res.json();
    return data.transcript || null;
  } catch {
    return null;
  }
}
