import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockAuthSession, mockNoAuth, readJson } from "../helpers";
import { mockDb } from "../setup";

import { POST, GET } from "@/app/api/feedback/route";

describe("POST /api/feedback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    mockNoAuth();
    const req = new Request("http://localhost/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 4, context: "practice:roleplay" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid rating", async () => {
    mockAuthSession();
    const req = new Request("http://localhost/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 0, context: "practice:roleplay" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing context", async () => {
    mockAuthSession();
    const req = new Request("http://localhost/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 3 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates feedback with rating and comment", async () => {
    mockAuthSession();
    mockDb.userFeedback = { create: vi.fn().mockResolvedValue({ id: "fb-1" }), findMany: vi.fn() };

    const req = new Request("http://localhost/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 5, comment: "Great drill!", context: "practice:ackerman" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await readJson(res);
    expect(data.id).toBe("fb-1");
  });

  it("creates feedback without comment", async () => {
    mockAuthSession();
    mockDb.userFeedback = { create: vi.fn().mockResolvedValue({ id: "fb-2" }), findMany: vi.fn() };

    const req = new Request("http://localhost/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 2, context: "practice:mirror" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createCall = mockDb.userFeedback.create.mock.calls[0][0];
    expect(createCall.data.comment).toBeNull();
  });
});

describe("GET /api/feedback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    mockNoAuth();
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns user feedback", async () => {
    mockAuthSession();
    mockDb.userFeedback = {
      create: vi.fn(),
      findMany: vi.fn().mockResolvedValue([
        { id: "fb-1", rating: 5, context: "practice:roleplay" },
      ]),
    };

    const res = await GET();
    const data = await readJson(res);
    expect(data.feedback).toHaveLength(1);
  });
});
