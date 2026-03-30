import { describe, it, expect, beforeEach, vi } from "vitest";
import { readJson } from "../helpers";
import { mockDb } from "../setup";

// Need to read health route
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns ok status", async () => {
    mockDb.user.count.mockResolvedValue(5);
    const res = await GET();
    const data = await readJson(res);
    expect(data.status).toBe("ok");
  });
});
