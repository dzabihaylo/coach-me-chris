import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockAdminSession, mockNoAdmin, readJson } from "../helpers";
import { mockDb } from "../setup";

import { GET, POST, DELETE } from "@/app/api/admin/whitelist/route";

describe("GET /api/admin/whitelist", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 403 for non-admin", async () => {
    mockNoAdmin();
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns whitelist entries with lastLoginAt", async () => {
    mockAdminSession();
    const entries = [
      { email: "a@b.com", role: "user", lastLoginAt: "2026-03-29T10:00:00Z" },
      { email: "b@c.com", role: "admin", lastLoginAt: null },
    ];
    mockDb.allowedEmail.findMany.mockResolvedValue(entries);

    const res = await GET();
    const data = await readJson(res);
    expect(data.entries).toHaveLength(2);
    expect(data.entries[0].lastLoginAt).toBe("2026-03-29T10:00:00Z");
    expect(data.entries[1].lastLoginAt).toBeNull();
  });
});

describe("POST /api/admin/whitelist", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 403 for non-admin", async () => {
    mockNoAdmin();
    const req = new Request("http://localhost/api/admin/whitelist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "new@test.com" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("returns 400 for missing email", async () => {
    mockAdminSession();
    const req = new Request("http://localhost/api/admin/whitelist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid email format", async () => {
    mockAdminSession();
    const req = new Request("http://localhost/api/admin/whitelist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 409 for duplicate email", async () => {
    mockAdminSession();
    mockDb.allowedEmail.findUnique.mockResolvedValue({ email: "exists@test.com" });

    const req = new Request("http://localhost/api/admin/whitelist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "exists@test.com" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it("adds email and creates audit log", async () => {
    mockAdminSession();
    mockDb.allowedEmail.findUnique.mockResolvedValue(null);
    mockDb.allowedEmail.create.mockResolvedValue({ email: "new@test.com", role: "user" });
    mockDb.auditLog.create.mockResolvedValue({});

    const req = new Request("http://localhost/api/admin/whitelist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "New@Test.com", role: "user" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(mockDb.allowedEmail.create).toHaveBeenCalledOnce();
    expect(mockDb.auditLog.create).toHaveBeenCalledOnce();

    // Verify email was normalized to lowercase
    const createCall = mockDb.allowedEmail.create.mock.calls[0][0];
    expect(createCall.data.email).toBe("new@test.com");
  });

  it("defaults role to user when not admin", async () => {
    mockAdminSession();
    mockDb.allowedEmail.findUnique.mockResolvedValue(null);
    mockDb.allowedEmail.create.mockResolvedValue({ email: "x@y.com", role: "user" });
    mockDb.auditLog.create.mockResolvedValue({});

    const req = new Request("http://localhost/api/admin/whitelist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "x@y.com", role: "superadmin" }),
    });
    await POST(req);
    const createCall = mockDb.allowedEmail.create.mock.calls[0][0];
    expect(createCall.data.role).toBe("user");
  });
});

describe("DELETE /api/admin/whitelist", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 403 for non-admin", async () => {
    mockNoAdmin();
    const req = new Request("http://localhost/api/admin/whitelist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "x@y.com" }),
    });
    const res = await DELETE(req);
    expect(res.status).toBe(403);
  });

  it("prevents self-removal", async () => {
    mockAdminSession({ email: "admin@example.com" });
    const req = new Request("http://localhost/api/admin/whitelist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@example.com" }),
    });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
    const data = await readJson(res);
    expect(data.error).toContain("yourself");
  });

  it("deletes email and creates audit log", async () => {
    mockAdminSession();
    mockDb.allowedEmail.delete.mockResolvedValue({});
    mockDb.auditLog.create.mockResolvedValue({});

    const req = new Request("http://localhost/api/admin/whitelist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "remove@test.com" }),
    });
    const res = await DELETE(req);
    const data = await readJson(res);
    expect(data.ok).toBe(true);
    expect(mockDb.allowedEmail.delete).toHaveBeenCalledOnce();
    expect(mockDb.auditLog.create).toHaveBeenCalledOnce();
  });
});
