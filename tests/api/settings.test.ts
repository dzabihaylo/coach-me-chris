import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockAuthSession, mockNoAuth, readJson } from "../helpers";
import { mockDb } from "../setup";

import { GET, PUT } from "@/app/api/settings/route";

describe("GET /api/settings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    mockNoAuth();
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 404 for missing user", async () => {
    mockAuthSession();
    mockDb.user.findUnique.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("returns full profile without Granola key", async () => {
    mockAuthSession();
    mockDb.user.findUnique.mockResolvedValue({
      name: "Dave",
      email: "dave@test.com",
      image: null,
      granolaApiKey: null,
      createdAt: new Date("2026-01-15"),
    });

    const res = await GET();
    const data = await readJson(res);
    expect(data.name).toBe("Dave");
    expect(data.email).toBe("dave@test.com");
    expect(data.hasGranolaKey).toBe(false);
    expect(data.granolaKeyPrefix).toBeNull();
    expect(data.createdAt).toBeTruthy();
  });

  it("returns Granola key prefix when set", async () => {
    mockAuthSession();
    mockDb.user.findUnique.mockResolvedValue({
      name: null,
      email: "test@example.com",
      image: null,
      granolaApiKey: "grano_1234567890abcdef",
      createdAt: new Date(),
    });

    const res = await GET();
    const data = await readJson(res);
    expect(data.hasGranolaKey).toBe(true);
    expect(data.granolaKeyPrefix).toBe("grano_12...");
  });
});

describe("PUT /api/settings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    mockNoAuth();
    const req = new Request("http://localhost/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test" }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(401);
  });

  it("updates display name", async () => {
    mockAuthSession();
    mockDb.user.update.mockResolvedValue({});

    const req = new Request("http://localhost/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "  New Name  " }),
    });
    const res = await PUT(req);
    const data = await readJson(res);
    expect(data.ok).toBe(true);

    const updateCall = mockDb.user.update.mock.calls[0][0];
    expect(updateCall.data.name).toBe("New Name"); // trimmed
  });

  it("clears name when empty string", async () => {
    mockAuthSession();
    mockDb.user.update.mockResolvedValue({});

    const req = new Request("http://localhost/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);

    const updateCall = mockDb.user.update.mock.calls[0][0];
    expect(updateCall.data.name).toBeNull();
  });

  it("updates Granola API key", async () => {
    mockAuthSession();
    mockDb.user.update.mockResolvedValue({});

    const req = new Request("http://localhost/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ granolaApiKey: "  my-key-123  " }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);

    const updateCall = mockDb.user.update.mock.calls[0][0];
    // Stored encrypted (mock crypto prefixes "enc:"); trimmed before encrypting.
    expect(updateCall.data.granolaApiKey).toBe("enc:my-key-123");
  });

  it("clears Granola key when empty", async () => {
    mockAuthSession();
    mockDb.user.update.mockResolvedValue({});

    const req = new Request("http://localhost/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ granolaApiKey: "" }),
    });
    await PUT(req);

    const updateCall = mockDb.user.update.mock.calls[0][0];
    expect(updateCall.data.granolaApiKey).toBeNull();
  });

  it("updates both name and key at once", async () => {
    mockAuthSession();
    mockDb.user.update.mockResolvedValue({});

    const req = new Request("http://localhost/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Dave", granolaApiKey: "abc123" }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);

    const updateCall = mockDb.user.update.mock.calls[0][0];
    expect(updateCall.data.name).toBe("Dave");
    expect(updateCall.data.granolaApiKey).toBe("enc:abc123");
  });

  it("returns 400 when no valid fields provided", async () => {
    mockAuthSession();

    const req = new Request("http://localhost/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unknownField: "test" }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });
});
