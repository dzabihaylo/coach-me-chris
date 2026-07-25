import { vi } from "vitest";

// ---------- Mock: @/lib/auth ----------
vi.mock("@/lib/auth", () => {
  const authFn = vi.fn().mockResolvedValue(null);
  return {
    auth: authFn,
    handlers: {},
    signIn: vi.fn(),
    signOut: vi.fn(),
  };
});

// ---------- Mock: @/lib/admin ----------
vi.mock("@/lib/admin", () => ({
  requireAdmin: vi.fn().mockResolvedValue(null),
}));

// ---------- Mock: @/lib/db ----------
const mockDb = {
  callReview: {
    create: vi.fn(),
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn(),
    delete: vi.fn(),
  },
  practiceSession: {
    create: vi.fn(),
    findMany: vi.fn().mockResolvedValue([]),
    count: vi.fn().mockResolvedValue(0),
  },
  liveSession: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  allowedEmail: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
    count: vi.fn().mockResolvedValue(5),
  },
  userFeedback: {
    create: vi.fn(),
    findMany: vi.fn().mockResolvedValue([]),
  },
};

vi.mock("@/lib/db", () => ({ db: mockDb }));

// ---------- Mock: @anthropic-ai/sdk ----------
const mockAnthropicCreate = vi.fn();
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class {
      messages = { create: mockAnthropicCreate };
    },
  };
});

// ---------- Mock: @/lib/voss-prompts ----------
vi.mock("@/lib/voss-prompts", () => ({
  VOSS_FRAMEWORK: "mock-voss-framework",
  buildAdaptiveContext: vi.fn().mockResolvedValue("USER LEVEL: Beginner"),
}));

// ---------- Mock: @/lib/claude ----------
vi.mock("@/lib/claude", () => ({
  anthropic: { messages: { create: mockAnthropicCreate } },
  buildLiveCoachingPrompt: vi.fn().mockReturnValue("mock-live-prompt"),
  buildAfterActionReviewPrompt: vi.fn().mockReturnValue("mock-review-prompt"),
  // Real extraction logic so tests exercise the text-block lookup.
  firstText: (content: Array<{ type: string; text?: string }>) =>
    content.find((b) => b.type === "text")?.text ?? null,
  VOSS_DIMENSIONS: [],
  VOSS_FRAMEWORK: "mock-voss-framework",
  buildAdaptiveContext: vi.fn().mockResolvedValue("USER LEVEL: Beginner"),
}));

// ---------- Mock: @/lib/rate-limit (passthrough by default) ----------
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockReturnValue({ allowed: true, remaining: 99 }),
}));

// ---------- Mock: @/lib/crypto (reversible, no AUTH_SECRET needed) ----------
vi.mock("@/lib/crypto", () => ({
  encryptSecret: (s: string) => "enc:" + s,
  decryptSecret: (s: string) => (s.startsWith("enc:") ? s.slice(4) : s),
}));

// Export references for tests to manipulate
export { mockDb, mockAnthropicCreate };
