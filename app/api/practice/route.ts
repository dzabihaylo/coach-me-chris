import { NextRequest } from "next/server";
import { anthropic } from "@/lib/claude";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { parseClaudeJson } from "@/lib/safe-json";

export const maxDuration = 30;

const MIRROR_SYSTEM = `You are a negotiation training partner for a mirroring drill. The user is practicing Chris Voss's mirroring technique — repeating the last 2-3 words of what someone says to encourage elaboration.

Your role: Respond to the user's mirror naturally, as the counterpart would in a negotiation. If they mirror correctly (repeating last 2-3 words with a slight upward inflection), continue the conversation with 1-2 new sentences that give them another mirroring opportunity. If they don't mirror correctly, gently note it and replay the line.

Always respond with JSON: {"counterpartResponse": "...", "mirrorCorrect": true|false|null, "feedback": "...", "nextOpportunity": "..."}`;

const ACKERMAN_SYSTEM = `You are a negotiation training partner for a price defense drill. The user is a SELLER practicing how to defend their price against a buyer using Ackerman-style tactics to grind them down.

Scenario: The user is selling consulting services. Their listed price is $150,000. The buyer (you) has an internal budget of $120,000 but will try to negotiate as low as possible using Ackerman tactics: anchoring at $85,000, then moving to $100,000, then $110,000, then $120,000.

Your role as the buyer: push back on price, cite competitor quotes, question value, use silence and "we can't go that high" pressure. Be realistic but not hostile.

You have TWO jobs in each response:
1. COACH: Evaluate the user's MOST RECENT message. What Voss techniques did they use well? What did they miss? Be specific — quote their words and suggest concrete alternative phrasing. Techniques to look for: labeling, calibrated questions, loss framing, accusation audits, mirroring, anchoring on value, never splitting the difference.
2. BUYER: Then respond in character as the buyer, reacting realistically to what the user said.

"feedback" must always be about the user's last message, not about the scenario in general. If the user hasn't said anything yet (first message), set feedback to null.

Respond with JSON: {"buyerResponse": "...", "buyerCurrentOffer": 85000, "feedback": "...", "tip": "..."}`;

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

Be realistic — push back, be skeptical, let natural "No" opportunities arise. When the seller uses Voss techniques well, respond authentically. Keep responses to 2-4 sentences.

You have TWO jobs in each response:
1. COACH: Evaluate the user's MOST RECENT message. What Voss techniques did they use? What opportunities did they miss? Be specific — quote their words, name the technique (or missed technique), and suggest concrete alternative phrasing. If the user hasn't said anything yet (first message), set feedback to null.
2. BUYER: Then respond in character as Alex Chen.

Respond ONLY with valid JSON: {"buyerResponse": "...", "feedback": "...|null", "tip": "...|null"}`;

export async function POST(req: NextRequest) {
  const authSession = await auth();
  if (!authSession?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = authSession.user.id;

  const { allowed } = rateLimit(userId, 30, 60_000); // 30 practice calls/min
  if (!allowed) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

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

    const response = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 512,
      system: systemPrompt,
      messages: conversationMessages,
    });

    const content = response.content[0];
    if (content.type !== "text") throw new Error("Bad response");

    const parsed: Record<string, unknown> = parseClaudeJson(content.text);

    if (saveSession) {
      await db.practiceSession.create({
        data: {
          drillType,
          userId,
          score: (saveSession.score as number) || 0,
          rounds: (saveSession.rounds as number) || conversationMessages.length,
          sessionJson: JSON.stringify({ messages: conversationMessages, result: parsed }),
        },
      });
    }

    return Response.json({ result: parsed, messages: conversationMessages });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[practice]", message);
    return Response.json({ error: "Practice session failed" }, { status: 500 });
  }
}
