import { NextRequest } from "next/server";
import { anthropic, LIVE_COACHING_SYSTEM_PROMPT } from "@/lib/claude";

export async function POST(req: NextRequest) {
  const { transcript } = await req.json();

  if (!transcript || transcript.trim().length < 10) {
    return Response.json({ nudge: null, technique: null, confidence: 0 });
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 100,
      system: LIVE_COACHING_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Recent conversation (last ~60 seconds):\n\n${transcript}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return Response.json({ nudge: null, technique: null, confidence: 0 });
    }

    const text = content.text.trim();
    const parsed = JSON.parse(text);
    return Response.json(parsed);
  } catch {
    return Response.json({ nudge: null, technique: null, confidence: 0 });
  }
}
