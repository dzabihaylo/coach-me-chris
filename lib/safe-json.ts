/** Parse JSON safely, returning fallback on failure. */
export function safeJsonParse<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

/**
 * Extract the first balanced JSON object/array value from text, respecting
 * string literals and escapes. Unlike a greedy `{...}` regex, this stops at the
 * matching close brace, so trailing prose — even prose containing braces —
 * doesn't corrupt the match.
 */
function extractBalanced(text: string): string | null {
  const start = text.search(/[{[]/);
  if (start === -1) return null;
  const open = text[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') {
      inStr = true;
    } else if (c === open) {
      depth++;
    } else if (c === close) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

/** Extract and parse JSON from Claude response, handling code fences and trailing text. */
export function parseClaudeJson<T>(text: string): T {
  // First try: extract JSON from markdown code fences (handles trailing text after fence)
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1].trim()) as T;
  }

  // Second try: first balanced { } or [ ] value in the text
  const balanced = extractBalanced(text);
  if (balanced) {
    return JSON.parse(balanced) as T;
  }

  // Last resort: try parsing the whole thing after basic cleanup
  const cleaned = text.trim();
  return JSON.parse(cleaned) as T;
}
