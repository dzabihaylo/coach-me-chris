import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Don't use the mock for this test — test the real implementation
vi.unmock("@/lib/rate-limit");

// We need to isolate each test from the module-level state
describe("rateLimit", () => {
  let rateLimit: typeof import("@/lib/rate-limit").rateLimit;

  beforeEach(async () => {
    vi.useFakeTimers();
    // Re-import fresh module each time to reset Map state
    vi.resetModules();
    const mod = await import("@/lib/rate-limit");
    rateLimit = mod.rateLimit;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests under the limit", () => {
    const r1 = rateLimit("user1", 3, 60_000);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = rateLimit("user1", 3, 60_000);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);
  });

  it("blocks requests over the limit", () => {
    rateLimit("user1", 2, 60_000);
    rateLimit("user1", 2, 60_000);
    const r3 = rateLimit("user1", 2, 60_000);
    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
  });

  it("resets after window expires", () => {
    rateLimit("user1", 1, 1000);
    const blocked = rateLimit("user1", 1, 1000);
    expect(blocked.allowed).toBe(false);

    vi.advanceTimersByTime(1001);
    const fresh = rateLimit("user1", 1, 1000);
    expect(fresh.allowed).toBe(true);
  });

  it("tracks users independently", () => {
    rateLimit("user1", 1, 60_000);
    const r = rateLimit("user2", 1, 60_000);
    expect(r.allowed).toBe(true);
  });
});
