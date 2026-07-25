import { NextRequest } from "next/server";
import { anthropic, firstText } from "@/lib/claude";
import { VOSS_FRAMEWORK, buildAdaptiveContext } from "@/lib/voss-prompts";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { parseClaudeJson } from "@/lib/safe-json";

export const maxDuration = 60;

// ─── Prompt builders (take adaptive context) ────────────────────────────────

function buildMirrorPrompt(ctx: string): string {
  return `You are a negotiation training partner for a mirroring drill. The user is practicing Chris Voss's mirroring technique — repeating the last 1-3 words of what someone says to encourage elaboration.

${ctx}

Your role: Respond to the user's mirror naturally, as the counterpart would in a negotiation. If they mirror correctly (repeating last 1-3 words with a slight upward inflection), continue the conversation with 1-2 new sentences that give them another mirroring opportunity. If they don't mirror correctly, gently note it and replay the line.

Grade strictly: the mirror must be the last 1-3 KEY words, not a paraphrase or a question about the topic. Silence after the mirror matters — if they add extra words, note that.

Always respond with JSON: {"counterpartResponse": "...", "mirrorCorrect": true|false|null, "feedback": "...", "nextOpportunity": "..."}`;
}

function buildAckermanPrompt(ctx: string): string {
  return `You are a negotiation training partner for a price defense drill.

${VOSS_FRAMEWORK}

${ctx}

SCENARIO: The user is a SELLER of consulting services. Their listed price is $150,000. You (the buyer) have an internal budget of $120,000 but will try to negotiate as low as possible using Ackerman tactics: anchoring at $85,000, then moving to $100,000, then $110,000, then $120,000.

YOUR ROLE AS BUYER: Push back on price, cite competitor quotes, question value, use silence and "we can't go that high" pressure. Be realistic but not hostile. Keep buyer responses to 2-3 sentences max.

If the user is ADVANCED, be a tougher buyer — use more sophisticated pressure tactics, bring up committee decisions, mention competing proposals with specific numbers, create urgency.

You have TWO jobs in each response:
1. COACH: Evaluate the user's MOST RECENT message against ALL 10 Voss dimensions. What did they use? What did they miss? Be specific — quote their words, name the technique, suggest exact alternative phrasing. Prioritize their WEAKEST dimensions (see user level above). Keep to 1-2 sentences.
2. BUYER: Then respond in character, reacting realistically to what the user said.

If the user hasn't said anything yet (first message), set feedback and tip to null.

Respond with JSON: {"buyerResponse": "...", "buyerCurrentOffer": 85000, "feedback": "...", "tip": "..."}`;
}

function buildCalibratedPrompt(ctx: string): string {
  return `You are a negotiation coach helping someone convert yes/no questions into calibrated "How" and "What" questions from Chris Voss's framework.

${ctx}

Rules for calibrated questions:
- Start with "How" or "What" (never "Why" — it sounds accusatory)
- Give the counterpart the illusion of control
- Force them to think collaboratively
- Key examples: "How can we make this work?", "What's most important to you here?", "How am I supposed to do that?", "What does success look like for you?"

For ADVANCED users: push beyond basic rewrites. Suggest questions that combine calibrated framing with other Voss techniques (labeling + question, loss framing + question). Note when a question could also serve as an accusation audit or black swan probe.

The user will give you a yes/no question. Convert it to 2-3 calibrated alternatives and explain why each works.

Respond with JSON: {"original": "...", "alternatives": [{"question": "...", "why": "..."}], "bestPick": 0}`;
}

function buildRoleplayPrompt(ctx: string): string {
  return `You are a realistic enterprise software buyer named Alex Chen, VP of Operations at a mid-size logistics company (500 employees). You are in a vendor call.

${VOSS_FRAMEWORK}

${ctx}

YOUR BACKSTORY:
- You have budget pressure and are already using a competitor ($180K/year)
- Your team is skeptical of switching costs
- You care deeply about implementation risk
- You've been burned by a failed software rollout 2 years ago
- You have authority but need CFO sign-off for anything over $200K
- You have a Q3 deadline pressure you haven't mentioned yet (BLACK SWAN: if discovered through skillful questioning, you'll open up and move fast)

Be realistic — push back, be skeptical, let natural "No" opportunities arise. When the seller uses Voss techniques well, respond authentically (e.g., if they get a genuine "That's right" moment, reward it with real disclosure). Keep to 2-3 sentences.

If the user is ADVANCED, be a harder buyer — more evasive, more objections, require more skill to crack. Don't give up the black swan easily.

You have TWO jobs in each response:
1. COACH: Evaluate the user's MOST RECENT message against ALL 10 Voss dimensions. Quote their words, name the technique used or missed, and suggest exact alternative phrasing. Prioritize their WEAKEST dimensions. Keep to 1-2 sentences. If they haven't said anything yet, set feedback to null.
2. BUYER: Then respond in character as Alex Chen.

Respond ONLY with valid JSON: {"buyerResponse": "...", "feedback": "...|null", "tip": "...|null"}`;
}

// ─── Route handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const authSession = await auth();
  if (!authSession?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = authSession.user.id;

  const { allowed } = rateLimit(userId, 30, 60_000);
  if (!allowed) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { drillType, messages, userInput, saveSession } = await req.json();

  // Build adaptive coaching context from user's history
  const adaptiveContext = await buildAdaptiveContext(userId);

  let systemPrompt = "";
  switch (drillType) {
    case "mirror":
      systemPrompt = buildMirrorPrompt(adaptiveContext);
      break;
    case "ackerman":
      systemPrompt = buildAckermanPrompt(adaptiveContext);
      break;
    case "calibrated":
      systemPrompt = buildCalibratedPrompt(adaptiveContext);
      break;
    case "roleplay":
      systemPrompt = buildRoleplayPrompt(adaptiveContext);
      break;
    default:
      return Response.json({ error: "Unknown drill type" }, { status: 400 });
  }

  try {
    const conversationMessages = messages || [];
    if (userInput) {
      conversationMessages.push({ role: "user", content: userInput });
    }

    // Strip to only role+content — extra fields (e.g. latencyMs) break the API
    const cleanMessages = conversationMessages.map(
      (m: { role: string; content: string }) => ({ role: m.role, content: m.content })
    );

    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      // Thinking off: keep roleplay turns snappy and preserve the token budget
      // for the reply (Sonnet 5 runs adaptive thinking by default).
      thinking: { type: "disabled" },
      system: systemPrompt,
      messages: cleanMessages,
    });

    const text = firstText(response.content);
    if (!text) throw new Error("Bad response");

    let parsed: Record<string, unknown>;
    try {
      parsed = parseClaudeJson(text);
    } catch {
      parsed = { buyerResponse: text, counterpartResponse: text, feedback: null, tip: null };
    }

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
    return Response.json({ error: `Practice session failed: ${message}` }, { status: 500 });
  }
}
