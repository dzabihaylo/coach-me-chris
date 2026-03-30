import { describe, it, expect } from "vitest";
import { safeJsonParse, parseClaudeJson } from "@/lib/safe-json";

describe("safeJsonParse", () => {
  it("parses valid JSON", () => {
    expect(safeJsonParse('{"a":1}', {})).toEqual({ a: 1 });
  });

  it("returns fallback for invalid JSON", () => {
    expect(safeJsonParse("not json", "fallback")).toBe("fallback");
  });

  it("returns fallback for null/undefined", () => {
    expect(safeJsonParse(null, [])).toEqual([]);
    expect(safeJsonParse(undefined, 42)).toBe(42);
  });

  it("returns fallback for empty string", () => {
    expect(safeJsonParse("", "nope")).toBe("nope");
  });
});

describe("parseClaudeJson", () => {
  it("parses raw JSON", () => {
    expect(parseClaudeJson('{"nudge":"Mirror that"}')).toEqual({
      nudge: "Mirror that",
    });
  });

  it("strips markdown code fences", () => {
    const input = '```json\n{"score":7}\n```';
    expect(parseClaudeJson(input)).toEqual({ score: 7 });
  });

  it("strips fences without language tag", () => {
    const input = '```\n{"ok":true}\n```';
    expect(parseClaudeJson(input)).toEqual({ ok: true });
  });

  it("handles whitespace around fences", () => {
    const input = '  ```json\n  {"a":1}  \n```  ';
    expect(parseClaudeJson(input)).toEqual({ a: 1 });
  });

  it("throws on invalid JSON", () => {
    expect(() => parseClaudeJson("not json at all")).toThrow();
  });
});
