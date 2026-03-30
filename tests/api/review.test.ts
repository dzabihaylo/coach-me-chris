import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockJsonRequest, mockGetRequest, mockAuthSession, mockNoAuth, mockRateLimited, readJson } from "../helpers";
import { mockAnthropicCreate, mockDb } from "../setup";

import { POST, GET } from "@/app/api/review/route";

const MOCK_FEEDBACK = {
  executiveSummary: "Good call",
  overallScore: 7.5,
  highlights: [],
  topOpportunity: { technique: "mirroring", moment: "x", alternativeLanguage: "y", why: "z" },
  dimensionDetails: {
    tacticalEmpathy: { score: 7, evidence: "ok", specificMoments: [] },
    mirroring: { score: 6, evidence: "ok", specificMoments: [] },
    labeling: { score: 8, evidence: "ok", specificMoments: [] },
    calibratedQuestions: { score: 5, evidence: "ok", specificMoments: [] },
    thatsRight: { score: 7, evidence: "ok", specificMoments: [] },
    usingNo: { score: 4, evidence: "ok", specificMoments: [] },
    accusationAudit: { score: 3, evidence: "ok", specificMoments: [] },
    lossFraming: { score: 6, evidence: "ok", specificMoments: [] },
    ackermanBargaining: { score: 2, evidence: "ok", specificMoments: [] },
    blackSwanDiscovery: { score: 5, evidence: "ok", specificMoments: [] },
  },
};

describe("POST /api/review", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockNoAuth();
    const res = await POST(mockJsonRequest({ transcriptText: "long enough text for review analysis" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for short transcript", async () => {
    mockAuthSession();
    const res = await POST(mockJsonRequest({ transcriptText: "too short" }));
    expect(res.status).toBe(400);
    const data = await readJson(res);
    expect(data.error).toContain("too short");
  });

  it("returns 400 for missing transcript", async () => {
    mockAuthSession();
    const res = await POST(mockJsonRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 for oversized transcript", async () => {
    mockAuthSession();
    const res = await POST(mockJsonRequest({ transcriptText: "x".repeat(100_001) }));
    expect(res.status).toBe(400);
    const data = await readJson(res);
    expect(data.error).toContain("too long");
  });

  it("creates review and returns feedback", async () => {
    mockAuthSession();
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(MOCK_FEEDBACK) }],
    });
    const mockReview = { id: "rev-1", ...MOCK_FEEDBACK };
    mockDb.callReview.create.mockResolvedValue(mockReview);

    const res = await POST(
      mockJsonRequest({
        title: "Test Call",
        transcriptText: "A".repeat(60),
      })
    );

    expect(res.status).toBe(200);
    const data = await readJson(res);
    expect(data.feedback.overallScore).toBe(7.5);
    expect(mockDb.callReview.create).toHaveBeenCalledOnce();
  });

  it("returns 429 when rate limited", async () => {
    mockAuthSession();
    mockRateLimited();

    const res = await POST(mockJsonRequest({ transcriptText: "A".repeat(60) }));
    expect(res.status).toBe(429);
  });
});

describe("GET /api/review", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockNoAuth();
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns user reviews", async () => {
    mockAuthSession();
    const reviews = [
      { id: "r1", title: "Call 1", overallScore: 7 },
      { id: "r2", title: "Call 2", overallScore: 8 },
    ];
    mockDb.callReview.findMany.mockResolvedValue(reviews);

    const res = await GET();
    const data = await readJson(res);
    expect(data.reviews).toHaveLength(2);
  });
});
