import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockJsonRequest, mockAuthSession, mockNoAuth, readJson } from "../helpers";
import { mockDb } from "../setup";

import { POST } from "@/app/api/live-session/route";

describe("POST /api/live-session", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    mockNoAuth();
    const res = await POST(mockJsonRequest({ action: "start" }));
    expect(res.status).toBe(401);
  });

  it("starts a new session", async () => {
    mockAuthSession();
    mockDb.liveSession.create.mockResolvedValue({ id: "sess-1" });

    const res = await POST(mockJsonRequest({ action: "start" }));
    const data = await readJson(res);
    expect(data.sessionId).toBe("sess-1");
  });

  it("logs a nudge to existing session", async () => {
    mockAuthSession();
    mockDb.liveSession.findUnique.mockResolvedValue({
      id: "sess-1",
      nudgesJson: "[]",
    });
    mockDb.liveSession.update.mockResolvedValue({});

    const res = await POST(
      mockJsonRequest({
        action: "nudge",
        sessionId: "sess-1",
        nudge: "Label that emotion",
      })
    );
    const data = await readJson(res);
    expect(data.ok).toBe(true);
    expect(mockDb.liveSession.update).toHaveBeenCalledOnce();
  });

  it("returns 404 for nudge on missing session", async () => {
    mockAuthSession();
    mockDb.liveSession.findUnique.mockResolvedValue(null);

    const res = await POST(
      mockJsonRequest({
        action: "nudge",
        sessionId: "nonexistent",
        nudge: "Mirror that",
      })
    );
    expect(res.status).toBe(404);
  });

  it("ends a session", async () => {
    mockAuthSession();
    mockDb.liveSession.update.mockResolvedValue({ id: "sess-1", endedAt: new Date() });

    const res = await POST(
      mockJsonRequest({
        action: "end",
        sessionId: "sess-1",
        transcript: "Full call transcript here...",
      })
    );
    const data = await readJson(res);
    expect(data.session).toBeTruthy();
  });

  it("returns 400 for unknown action", async () => {
    mockAuthSession();
    const res = await POST(mockJsonRequest({ action: "invalid" }));
    expect(res.status).toBe(400);
  });
});
