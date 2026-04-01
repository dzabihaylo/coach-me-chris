/** Parse JSON safely, returning fallback on failure. */
export function safeJsonParse<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

/** Extract and parse JSON from Claude response, handling code fences and trailing text. */
export function parseClaudeJson<T>(text: string): T {
  // First try: extract JSON from markdown code fences (handles trailing text after fence)
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1].trim()) as T;
  }

  // Second try: find the first { ... } or [ ... ] block in the text
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1]) as T;
  }

  // Last resort: try parsing the whole thing after basic cleanup
  const cleaned = text.trim();
  return JSON.parse(cleaned) as T;
}
