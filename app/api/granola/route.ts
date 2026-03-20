import { fetchGranolaMeetings, fetchGranolaTranscript } from "@/lib/granola";
import { NextRequest } from "next/server";

export async function GET() {
  const meetings = await fetchGranolaMeetings();
  return Response.json({ meetings });
}

export async function POST(req: NextRequest) {
  const { meetingId } = await req.json();
  const transcript = await fetchGranolaTranscript(meetingId);
  return Response.json({ transcript });
}
