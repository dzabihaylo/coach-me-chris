import { describe, it, expect, vi } from "vitest";

// Test the real module, not the reversible test double from setup.ts.
vi.unmock("@/lib/crypto");
process.env.AUTH_SECRET = process.env.AUTH_SECRET ?? "test-secret-for-crypto-roundtrip";

import { encryptSecret, decryptSecret } from "@/lib/crypto";

describe("crypto (real AES-256-GCM)", () => {
  it("round-trips a secret", () => {
    const plain = "grano_live_abc123XYZ";
    const enc = encryptSecret(plain);
    expect(enc.startsWith("enc.v1.")).toBe(true);
    expect(enc).not.toContain(plain); // ciphertext, not plaintext
    expect(decryptSecret(enc)).toBe(plain);
  });

  it("passes legacy plaintext through unchanged", () => {
    expect(decryptSecret("legacy-plain-key")).toBe("legacy-plain-key");
  });

  it("uses a random IV, so the same input encrypts differently", () => {
    expect(encryptSecret("same")).not.toBe(encryptSecret("same"));
  });
});
