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
  LIVE_COACHING_SYSTEM_PROMPT: "mock-live-prompt",
  AFTER_ACTION_REVIEW_PROMPT: "mock-review-prompt",
  VOSS_DIMENSIONS: [],
  VOSS_FRAMEWORK: "mock-voss-framework",
  buildAdaptiveContext: vi.fn().mockResolvedValue("USER LEVEL: Beginner"),
}));

// ---------- Mock: @/lib/rate-limit (passthrough by default) ----------
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockReturnValue({ allowed: true, remaining: 99 }),
}));

// Export references for tests to manipulate
export { mockDb, mockAnthropicCreate };
