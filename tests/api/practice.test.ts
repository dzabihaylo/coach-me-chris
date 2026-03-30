import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockJsonRequest, mockAuthSession, mockNoAuth, mockRateLimited, readJson } from "../helpers";
import { mockAnthropicCreate, mockDb } from "../setup";

import { POST } from "@/app/api/practice/route";

describe("POST /api/practice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockNoAuth();
    const res = await POST(mockJsonRequest({ drillType: "mirror", userInput: "test" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for unknown drill type", async () => {
    mockAuthSession();
    const res = await POST(mockJsonRequest({ drillType: "unknown", userInput: "hi" }));
    expect(res.status).toBe(400);
  });

  it("handles mirror drill", async () => {
    mockAuthSession();
    mockAnthropicCreate.mockResolvedValue({
      content: [
        {
          type: "text",
          text: '{"counterpartResponse":"Yes, the timeline...","mirrorCorrect":true,"feedback":"Good mirror!","nextOpportunity":"The timeline is tight"}',
        },
      ],
    });

    const res = await POST(
      mockJsonRequest({ drillType: "mirror", userInput: "The timeline?", messages: [] })
    );
    const data = await readJson(res);
    expect(data.result.mirrorCorrect).toBe(true);
  });

  it("handles calibrated drill", async () => {
    mockAuthSession();
    mockAnthropicCreate.mockResolvedValue({
      content: [
        {
          type: "text",
          text: '{"original":"Can you lower the price?","alternatives":[{"question":"How can we make this work within budget?","why":"Gives illusion of control"}],"bestPick":0}',
        },
      ],
    });

    const res = await POST(
      mockJsonRequest({ drillType: "calibrated", userInput: "Can you lower the price?" })
    );
    const data = await readJson(res);
    expect(data.result.alternatives).toHaveLength(1);
  });

  it("handles roleplay drill with coaching feedback", async () => {
    mockAuthSession();
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: "text", text: '{"buyerResponse":"Look, I appreciate the pitch, but we\'re happy with our current vendor.","feedback":null,"tip":null}' }],
    });

    const res = await POST(
      mockJsonRequest({ drillType: "roleplay", userInput: "Tell me about your pain points" })
    );
    const data = await readJson(res);
    expect(data.result.buyerResponse).toBeTruthy();
  });

  it("saves session when saveSession provided", async () => {
    mockAuthSession();
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: "text", text: '{"counterpartResponse":"ok","mirrorCorrect":true,"feedback":"","nextOpportunity":""}' }],
    });
    mockDb.practiceSession.create.mockResolvedValue({});

    const res = await POST(
      mockJsonRequest({
        drillType: "mirror",
        userInput: "The deadline?",
        messages: [],
        saveSession: { score: 8, rounds: 5 },
      })
    );
    expect(res.status).toBe(200);
    expect(mockDb.practiceSession.create).toHaveBeenCalledOnce();
  });

  it("returns 429 when rate limited", async () => {
    mockAuthSession();
    mockRateLimited();

    const res = await POST(mockJsonRequest({ drillType: "mirror", userInput: "test" }));
    expect(res.status).toBe(429);
  });
});
