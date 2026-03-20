import { NextRequest } from "next/server";
import { anthropic } from "@/lib/claude";
import { db } from "@/lib/db";

const MIRROR_SYSTEM = `You are a negotiation training partner for a mirroring drill. The user is practicing Chris Voss's mirroring technique — repeating the last 2-3 words of what someone says to encourage elaboration.

Your role: Respond to the user's mirror naturally, as the counterpart would in a negotiation. If they mirror correctly (repeating last 2-3 words with a slight upward inflection), continue the conversation with 1-2 new sentences that give them another mirroring opportunity. If they don't mirror correctly, gently note it and replay the line.

Always respond with JSON: {"counterpartResponse": "...", "mirrorCorrect": true|false|null, "feedback": "...", "nextOpportunity": "..."}`;

const ACKERMAN_SYSTEM = `You are a negotiation training partner for an Ackerman bargaining drill. The user is practicing the Ackerman method: start at 65% of target, move to 85%, then 95%, then 100% — with each concession getting smaller and adding non-monetary items at the end.

Scenario: The user is a buyer. The seller has an asking price of $100,000. The user's target is $80,000.

Track concession pattern and coach on: anchor low, use precise numbers (not round), add odd items in final concession, use "How am I supposed to do that?" to slow-walk.

Respond with JSON: {"sellerResponse": "...", "sellerCurrentPrice": 95000, "feedback": "...", "tip": "..."}`;

const CALIBRATED_QUESTION_SYSTEM = `You are a negotiation coach helping someone convert yes/no questions into calibrated "How" and "What" questions from Chris Voss's framework.

Rules for calibrated questions:
- Start with "How" or "What" (never "Why" — it sounds accusatory)
- Give the counterpart the illusion of control
- Force them to think collaboratively
- Examples: "How can we make this work?" "What's most important to you here?" "How am I supposed to do that?"

The user will give you a yes/no question. Convert it to 2-3 calibrated alternatives and explain why each works.

Respond with JSON: {"original": "...", "alternatives": [{"question": "...", "why": "..."}], "bestPick": 0}`;

const ROLEPLAY_SYSTEM = `You are a realistic enterprise software buyer named Alex Chen, VP of Operations at a mid-size logistics company (500 employees). You are in a vendor call.

Your backstory:
- You have budget pressure and are already using a competitor ($180K/year)
- Your team is skeptical of switching costs
- You care deeply about implementation risk
- You've been burned by a failed software rollout 2 years ago
- You have authority but need CFO sign-off for anything over $200K
- You have a Q3 deadline pressure you haven't mentioned yet (BLACK SWAN: if discovered, you'll move fast)

Be realistic — push back, be skeptical, let natural "No" opportunities arise. When the seller uses Voss techniques well, respond authentically. Keep responses to 2-4 sentences.`;

export async function POST(req: NextRequest) {
  const { drillType, messages, userInput, saveSession } = await req.json();

  let systemPrompt = "";
  switch (drillType) {
    case "mirror":
      systemPrompt = MIRROR_SYSTEM;
      break;
    case "ackerman":
      systemPrompt = ACKERMAN_SYSTEM;
      break;
    case "calibrated":
      systemPrompt = CALIBRATED_QUESTION_SYSTEM;
      break;
    case "roleplay":
      systemPrompt = ROLEPLAY_SYSTEM;
      break;
    default:
      return Response.json({ error: "Unknown drill type" }, { status: 400 });
  }

  try {
    const conversationMessages = messages || [];
    if (userInput) {
      conversationMessages.push({ role: "user", content: userInput });
    }

    const isStructured = ["mirror", "ackerman", "calibrated"].includes(
      drillType
    );

    const response = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: isStructured ? 512 : 256,
      system: systemPrompt,
      messages: conversationMessages,
    });

    const content = response.content[0];
    if (content.type !== "text") throw new Error("Bad response");

    let parsed: Record<string, unknown>;
    if (isStructured) {
      const raw = content.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      parsed = JSON.parse(raw);
    } else {
      parsed = { counterpartResponse: content.text };
    }

    if (saveSession) {
      await db.practiceSession.create({
        data: {
          drillType,
          score: (saveSession.score as number) || 0,
          rounds: (saveSession.rounds as number) || conversationMessages.length,
          sessionJson: JSON.stringify({ messages: conversationMessages, result: parsed }),
        },
      });
    }

    return Response.json({ result: parsed, messages: conversationMessages });
  } catch (err) {
    console.error("Practice error:", err);
    return Response.json({ error: "Practice session failed" }, { status: 500 });
  }
}
