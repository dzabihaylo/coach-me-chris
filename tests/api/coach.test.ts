import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockJsonRequest, mockAuthSession, mockNoAuth, mockRateLimited, readJson } from "../helpers";
import { mockAnthropicCreate } from "../setup";

import { POST } from "@/app/api/coach/route";

describe("POST /api/coach", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockNoAuth();
    const res = await POST(mockJsonRequest({ transcript: "hello" }));
    expect(res.status).toBe(401);
  });

  it("returns empty nudge for short transcript", async () => {
    mockAuthSession();
    const res = await POST(mockJsonRequest({ transcript: "hi" }));
    const data = await readJson(res);
    expect(data.nudge).toBeNull();
  });

  it("returns empty nudge for missing transcript", async () => {
    mockAuthSession();
    const res = await POST(mockJsonRequest({}));
    const data = await readJson(res);
    expect(data.nudge).toBeNull();
  });

  it("calls Claude and returns nudge", async () => {
    mockAuthSession();
    mockAnthropicCreate.mockResolvedValue({
      content: [
        { type: "text", text: '{"nudge":"Label that emotion","technique":"labeling","confidence":0.8}' },
      ],
    });

    const res = await POST(
      mockJsonRequest({ transcript: "I really feel like this deal is going nowhere and I'm frustrated" })
    );
    const data = await readJson(res);
    expect(data.nudge).toBe("Label that emotion");
    expect(data.technique).toBe("labeling");
    expect(mockAnthropicCreate).toHaveBeenCalledOnce();
  });

  it("returns 429 when rate limited", async () => {
    mockAuthSession();
    mockRateLimited();

    const res = await POST(
      mockJsonRequest({ transcript: "some conversation about the deal" })
    );
    expect(res.status).toBe(429);
  });

  it("returns empty nudge on Claude error", async () => {
    mockAuthSession();
    mockAnthropicCreate.mockRejectedValue(new Error("API down"));

    const res = await POST(
      mockJsonRequest({ transcript: "some conversation about the deal" })
    );
    const data = await readJson(res);
    expect(data.nudge).toBeNull();
    expect(res.status).toBe(200);
  });
});
