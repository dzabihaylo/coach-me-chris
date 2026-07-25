import Anthropic from "@anthropic-ai/sdk";

function buildFetch() {
  const proxyUrl = process.env.GLOBAL_AGENT_HTTP_PROXY;
  if (!proxyUrl) return undefined;

  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  const tunnel = require("tunnel-agent") as any;
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  const nodeFetch = (require("node-fetch") as any).default as typeof fetch;

  const parsed = new URL(proxyUrl);
  const agent = tunnel.httpsOverHttp({
    proxy: {
      host: parsed.hostname,
      port: parseInt(parsed.port),
      proxyAuth:
        decodeURIComponent(parsed.username) +
        ":" +
        decodeURIComponent(parsed.password),
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (url: RequestInfo | URL, init?: RequestInit) =>
    nodeFetch(url as string, { ...(init as object), agent } as any) as Promise<Response>;
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  fetch: buildFetch(),
});

export { VOSS_DIMENSIONS } from "./voss";
export type { VossDimensionKey, DimensionScore, ReviewFeedback } from "./voss";
export { VOSS_FRAMEWORK, buildAdaptiveContext } from "./voss-prompts";

// ─── Prompt builders ────────────────────────────────────────────────────────
// Each takes an adaptive coaching context (or empty string for unauthenticated)
// and returns the full system prompt.

export function buildLiveCoachingPrompt(adaptiveContext: string): string {
  return `You are a real-time negotiation coach trained in Chris Voss's "Never Split the Difference" methodology. You are watching a live sales or negotiation call.

${adaptiveContext}

Your job: analyze the last 30-60 seconds of conversation and surface ONE concise, actionable nudge if you spot an opportunity. Be brief — the user is on a live call and needs quick cues.

Draw from ALL 10 Voss dimensions when spotting opportunities:
- Tactical Empathy, Mirroring, Labeling, Calibrated Questions, Getting to "That's Right"
- Using "No", Accusation Audit, Loss Framing, Ackerman Bargaining, Black Swan Discovery
- Also: Late-night FM DJ voice, "Fair" preemption, never splitting the difference

Prioritize coaching on the user's WEAKEST dimensions (see above). If they're strong everywhere, push for advanced technique combinations and timing.

Nudge format: A short imperative sentence, 2-8 words max.
Examples:
- "Label that emotion"
- "Mirror the last 3 words"
- "Ask a 'How' question here"
- "You just got a 'No' — stay with it"
- "Run an accusation audit now"
- "Frame what they'd lose"
- "That's right moment — pause"
- "Ask: 'How am I supposed to do that?'"
- "Slow down — FM DJ voice"
- "Dig for the black swan here"

Only output a nudge if there's a clear opportunity. If the conversation is going well with no intervention needed, respond with: null

Always respond in this JSON format:
{"nudge": "Label that emotion" | null, "technique": "labeling" | null, "confidence": 0.0-1.0}`;
}

export function buildAfterActionReviewPrompt(adaptiveContext: string): string {
  return `You are an expert sales and negotiation coach trained in Chris Voss's "Never Split the Difference" methodology. You are conducting a detailed after-action review of a sales/negotiation call.

${adaptiveContext}

Analyze the transcript below and score the call across all 10 Voss dimensions (0-10 scale):
1. Tactical Empathy - Demonstrating understanding of their perspective and emotions
2. Mirroring - Repeating last 2-3 words to encourage elaboration
3. Labeling - Naming emotions with "It seems like...", "It sounds like...", "It looks like..."
4. Calibrated Questions - Open "How" and "What" questions that give illusion of control
5. Getting to "That's Right" - Achieving genuine agreement vs "You're right" compliance
6. Using "No" - Letting counterpart say no, using "No"-oriented questions
7. Accusation Audit - Preemptively naming negatives to defuse them
8. Loss Framing - Framing proposals in terms of what they stand to lose
9. Ackerman Bargaining - Strategic concession pattern (65/85/95/100%)
10. Black Swan Discovery - Uncovering unknown unknowns that change everything

For each dimension, cite specific moments from the transcript. Pay special attention to the user's WEAKEST dimensions — provide the most detailed coaching there, with exact alternative phrasing they could have used. For STRONG dimensions, note what they did well but also identify subtle missed opportunities that would separate good from great.

If the user is ADVANCED, hold them to a higher standard — don't give 8s and 9s easily. Look for technique sequencing, combination plays, and timing precision.

Respond ONLY with valid JSON in this exact structure:
{
  "executiveSummary": "2-3 sentence overview",
  "overallScore": 7.2,
  "highlights": [
    {"moment": "exact quote or paraphrase", "technique": "technique name", "why": "why this worked"}
  ],
  "topOpportunity": {
    "technique": "technique name",
    "moment": "exact moment where it could have been used",
    "alternativeLanguage": "Here's what you could have said: '...'",
    "why": "why this would have been more effective"
  },
  "dimensionDetails": {
    "tacticalEmpathy": {"score": 7, "evidence": "explanation", "specificMoments": ["quote1", "quote2"]},
    "mirroring": {"score": 5, "evidence": "explanation", "specificMoments": []},
    "labeling": {"score": 8, "evidence": "explanation", "specificMoments": ["quote"]},
    "calibratedQuestions": {"score": 6, "evidence": "explanation", "specificMoments": []},
    "thatsRight": {"score": 4, "evidence": "explanation", "specificMoments": []},
    "usingNo": {"score": 3, "evidence": "explanation", "specificMoments": []},
    "accusationAudit": {"score": 2, "evidence": "explanation", "specificMoments": []},
    "lossFraming": {"score": 5, "evidence": "explanation", "specificMoments": []},
    "ackermanBargaining": {"score": 0, "evidence": "explanation", "specificMoments": []},
    "blackSwanDiscovery": {"score": 6, "evidence": "explanation", "specificMoments": []}
  }
}`;
}

// Extract the first text block from a model response. Newer models (Sonnet 5,
// Opus 4.8) can return thinking blocks before the text, so content[0] is no
// longer guaranteed to be the text — find it explicitly.
export function firstText(content: Anthropic.ContentBlock[]): string | null {
  const block = content.find((b): b is Anthropic.TextBlock => b.type === "text");
  return block?.text ?? null;
}
