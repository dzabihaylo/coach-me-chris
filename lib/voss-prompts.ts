import { db } from "@/lib/db";
import { VOSS_DIMENSIONS } from "@/lib/voss";

// ─── Full Voss framework reference ──────────────────────────────────────────
// Used in every prompt so the AI has a complete, consistent understanding.

export const VOSS_FRAMEWORK = `THE CHRIS VOSS NEGOTIATION FRAMEWORK (all 10 dimensions):

1. TACTICAL EMPATHY — Demonstrate understanding of the counterpart's perspective and emotions. Not sympathy — it's about showing you see their world. "It seems like you're under a lot of pressure from your board on this."

2. MIRRORING — Repeat the last 1-3 words (or key words) of what they said, with a slight upward inflection. Encourages them to elaborate without you asking a direct question. Silence after the mirror is critical.

3. LABELING — Name the emotion or dynamic you observe: "It seems like...", "It sounds like...", "It looks like..." Never use "I" — keep the focus on them. Labels defuse negative emotions and reinforce positive ones.

4. CALIBRATED QUESTIONS — Open-ended "How" and "What" questions that give the illusion of control. Never "Why" (sounds accusatory). Key phrases: "How am I supposed to do that?", "What does success look like for you?", "How can we make this work?"

5. GETTING TO "THAT'S RIGHT" — The goal is genuine agreement ("That's right"), not compliance ("You're right"). Achieved through summary + labeling. When they say "That's right," you've earned trust. "You're right" means they want you to stop talking.

6. USING "NO" — Let the counterpart say "No" — it gives them a feeling of safety and control. Use "No"-oriented questions: "Would it be ridiculous to...?", "Is it a bad idea to...?", "Have you given up on...?"

7. ACCUSATION AUDIT — Preemptively name every negative thing they could think about you: "You're probably thinking we're too expensive...", "I know this might seem like a lot of risk..." Defuses the negatives before they can weaponize them.

8. LOSS FRAMING — Frame proposals in terms of what they stand to LOSE by not acting, not what they gain by acting. Loss aversion is 2x stronger than desire for gain. "Without this, your team would continue dealing with X..."

9. ACKERMAN BARGAINING — The strategic concession model: 65% → 85% → 95% → 100% of target. Each concession gets smaller (showing resistance). Use precise non-round numbers. Add a non-monetary item in the final offer to signal you're at your limit. As a SELLER, recognize when the buyer is using this pattern and defend value instead of matching concessions.

10. BLACK SWAN DISCOVERY — Unknown unknowns that change everything. Hidden deadlines, internal politics, personal motivations, competitive pressures they haven't revealed. Discovered through deep listening, calibrated questions, and creating safety for disclosure.

ADDITIONAL VOSS PRINCIPLES:
- The Late-Night FM DJ Voice: Calm, slow, downward-inflecting tone that signals authority and calm. Use in tense moments.
- The 7-38-55 Rule: 7% of communication is words, 38% tone, 55% body language. In text drills, focus on word choice.
- Never Split the Difference: Compromise is lazy. Creative solutions beat meeting in the middle.
- The F-word (Fair): If someone says "I just want what's fair," they're putting you on the defensive. Preempt it: "I want you to feel I'm treating you fairly at all times."`;

// ─── Adaptive coaching context ──────────────────────────────────────────────
// Fetches user's actual performance data and builds a personalized prompt
// section that tells the AI where the user is strong, weak, and improving.

export async function buildAdaptiveContext(userId: string): Promise<string> {
  const reviews = await db.callReview.findMany({
    where: { userId },
    orderBy: { callDate: "desc" },
    take: 20,
    select: {
      tacticalEmpathy: true,
      mirroring: true,
      labeling: true,
      calibratedQuestions: true,
      thatsRight: true,
      usingNo: true,
      accusationAudit: true,
      lossFraming: true,
      ackermanBargaining: true,
      blackSwanDiscovery: true,
      overallScore: true,
    },
  });

  const practiceSessions = await db.practiceSession.count({
    where: { userId },
  });

  if (reviews.length === 0 && practiceSessions === 0) {
    return `USER LEVEL: Beginner (no reviewed calls yet, ${practiceSessions} practice sessions).
COACHING APPROACH: Be encouraging. Explain techniques clearly with examples. Don't assume prior knowledge of the framework. Focus on one technique at a time rather than overwhelming with all 10.`;
  }

  if (reviews.length === 0) {
    return `USER LEVEL: Early (${practiceSessions} practice sessions, no reviewed calls yet).
COACHING APPROACH: The user is practicing but hasn't submitted real call reviews. Focus on fundamentals and building confidence. Introduce techniques progressively.`;
  }

  // Compute averages across recent reviews
  const dimKeys = VOSS_DIMENSIONS.map((d) => d.key);
  const avgs: Record<string, number> = {};
  for (const key of dimKeys) {
    const sum = reviews.reduce((s, r) => s + ((r as Record<string, number>)[key] || 0), 0);
    avgs[key] = sum / reviews.length;
  }

  const overallAvg = reviews.reduce((s, r) => s + r.overallScore, 0) / reviews.length;

  // Sort dimensions by score
  const sorted = dimKeys
    .map((key) => {
      const dim = VOSS_DIMENSIONS.find((d) => d.key === key)!;
      return { key, label: dim.label, score: avgs[key] };
    })
    .sort((a, b) => a.score - b.score);

  const weakest = sorted.slice(0, 3);
  const strongest = sorted.slice(-3).reverse();

  // Check for improvement trend (compare first half vs second half of reviews)
  let trend = "stable";
  if (reviews.length >= 4) {
    const half = Math.floor(reviews.length / 2);
    const recentAvg = reviews.slice(0, half).reduce((s, r) => s + r.overallScore, 0) / half;
    const olderAvg = reviews.slice(half).reduce((s, r) => s + r.overallScore, 0) / (reviews.length - half);
    if (recentAvg > olderAvg + 0.5) trend = "improving";
    else if (recentAvg < olderAvg - 0.5) trend = "declining";
  }

  // Determine level
  let level = "Beginner";
  if (overallAvg >= 7.5 && reviews.length >= 5) level = "Advanced";
  else if (overallAvg >= 5 && reviews.length >= 3) level = "Intermediate";
  else if (reviews.length >= 2) level = "Developing";

  const lines = [
    `USER LEVEL: ${level} (${reviews.length} reviewed calls, ${practiceSessions} practice sessions, overall avg: ${overallAvg.toFixed(1)}/10, trend: ${trend}).`,
    "",
    `STRONGEST DIMENSIONS (push harder here — raise the bar, point out subtle missed opportunities, don't let them coast):`,
    ...strongest.map((d) => `- ${d.label}: ${d.score.toFixed(1)}/10`),
    "",
    `WEAKEST DIMENSIONS (focus coaching here — be specific with examples, suggest exact phrasing, celebrate small improvements):`,
    ...weakest.map((d) => `- ${d.label}: ${d.score.toFixed(1)}/10`),
    "",
  ];

  if (level === "Advanced") {
    lines.push(
      `COACHING APPROACH: This user is skilled. Don't praise basics — they know those. Challenge them on nuance: timing, sequencing techniques, reading between the lines, combining multiple techniques in one response. Push them toward mastery. Point out what a world-class negotiator would do differently. Be direct and demanding.`
    );
  } else if (level === "Intermediate") {
    lines.push(
      `COACHING APPROACH: This user has the fundamentals. Focus on their weak dimensions with concrete suggestions. When they use a technique well, briefly acknowledge it then move to what they could layer on top. Start expecting technique combinations, not just isolated moves.`
    );
  } else {
    lines.push(
      `COACHING APPROACH: Focus on one technique at a time. Celebrate correct use of techniques. Give clear, specific alternative phrasing they can use. Don't overwhelm — depth on their weakest area is better than breadth across all 10.`
    );
  }

  return lines.join("\n");
}
