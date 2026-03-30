import { describe, it, expect } from "vitest";

// Unmock so we test the real module
vi.unmock("@/lib/voss");

import { VOSS_DIMENSIONS } from "@/lib/voss";

describe("VOSS_DIMENSIONS", () => {
  it("has exactly 10 dimensions", () => {
    expect(VOSS_DIMENSIONS).toHaveLength(10);
  });

  it("each dimension has key, label, and abbr", () => {
    for (const d of VOSS_DIMENSIONS) {
      expect(d.key).toBeTruthy();
      expect(d.label).toBeTruthy();
      expect(d.abbr).toHaveLength(2);
    }
  });

  it("has unique keys", () => {
    const keys = VOSS_DIMENSIONS.map((d) => d.key);
    expect(new Set(keys).size).toBe(10);
  });

  it("includes core techniques", () => {
    const keys = VOSS_DIMENSIONS.map((d) => d.key);
    expect(keys).toContain("tacticalEmpathy");
    expect(keys).toContain("mirroring");
    expect(keys).toContain("labeling");
    expect(keys).toContain("ackermanBargaining");
    expect(keys).toContain("blackSwanDiscovery");
  });
});
