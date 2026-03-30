import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockGetRequest, mockJsonRequest, mockAuthSession, mockNoAuth, readJson } from "../helpers";
import { mockDb } from "../setup";
import { NextRequest } from "next/server";

import { GET, DELETE } from "@/app/api/review/[id]/route";

const makeParams = (id: string) => Promise.resolve({ id });

describe("GET /api/review/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockNoAuth();
    const res = await GET(mockGetRequest(), { params: makeParams("abc") });
    expect(res.status).toBe(401);
  });

  it("returns 404 for non-existent review", async () => {
    mockAuthSession();
    mockDb.callReview.findUnique.mockResolvedValue(null);
    const res = await GET(mockGetRequest(), { params: makeParams("missing") });
    expect(res.status).toBe(404);
  });

  it("returns review by id", async () => {
    mockAuthSession();
    const review = { id: "rev-1", title: "Test", overallScore: 8 };
    mockDb.callReview.findUnique.mockResolvedValue(review);

    const res = await GET(mockGetRequest(), { params: makeParams("rev-1") });
    const data = await readJson(res);
    expect(data.review.id).toBe("rev-1");
  });
});

describe("DELETE /api/review/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockNoAuth();
    const req = new NextRequest("http://localhost/api/review/abc", { method: "DELETE" });
    const res = await DELETE(req, { params: makeParams("abc") });
    expect(res.status).toBe(401);
  });

  it("returns 404 if review not found", async () => {
    mockAuthSession();
    mockDb.callReview.findUnique.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/review/abc", { method: "DELETE" });
    const res = await DELETE(req, { params: makeParams("abc") });
    expect(res.status).toBe(404);
  });

  it("deletes review and returns success", async () => {
    mockAuthSession();
    mockDb.callReview.findUnique.mockResolvedValue({ id: "rev-1" });
    mockDb.callReview.delete.mockResolvedValue({});

    const req = new NextRequest("http://localhost/api/review/rev-1", { method: "DELETE" });
    const res = await DELETE(req, { params: makeParams("rev-1") });
    const data = await readJson(res);
    expect(data.success).toBe(true);
    expect(mockDb.callReview.delete).toHaveBeenCalledOnce();
  });
});
