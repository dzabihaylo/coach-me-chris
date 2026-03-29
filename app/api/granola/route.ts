import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meetings = await db.granolaMeeting.findMany({
    orderBy: { date: "desc" },
    take: 50,
  });

  return Response.json({
    meetings: meetings.map((m) => ({
      id: m.id,
      title: m.title,
      date: m.date,
      participants: JSON.parse(m.participants),
      durationMinutes: m.durationMinutes,
      hasTranscript: !!m.transcript,
      reviewId: m.reviewId,
      syncedAt: m.syncedAt,
    })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { meetingId } = await req.json();
  if (!meetingId) {
    return Response.json({ error: "meetingId required" }, { status: 400 });
  }

  const meeting = await db.granolaMeeting.findUnique({
    where: { id: meetingId },
  });

  if (!meeting) {
    return Response.json({ error: "Meeting not found in cache" }, { status: 404 });
  }

  return Response.json({
    id: meeting.id,
    title: meeting.title,
    date: meeting.date,
    transcript: meeting.transcript,
    participants: JSON.parse(meeting.participants),
    durationMinutes: meeting.durationMinutes,
  });
}
