import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockAuthSession, mockNoAuth, readJson } from "../helpers";
import { mockDb } from "../setup";

import { GET } from "@/app/api/progress/route";

describe("GET /api/progress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockNoAuth();
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns empty progress for new user", async () => {
    mockAuthSession();
    mockDb.callReview.findMany.mockResolvedValue([]);
    mockDb.practiceSession.findMany.mockResolvedValue([]);

    const res = await GET();
    const data = await readJson(res);
    expect(data.totalCalls).toBe(0);
    expect(data.avgOverall).toBe(0);
    expect(data.totalPracticeSessions).toBe(0);
  });

  it("computes averages across reviews", async () => {
    mockAuthSession();
    mockDb.callReview.findMany.mockResolvedValue([
      {
        id: "r1", overallScore: 6,
        tacticalEmpathy: 8, mirroring: 4, labeling: 6,
        calibratedQuestions: 5, thatsRight: 7, usingNo: 3,
        accusationAudit: 2, lossFraming: 5, ackermanBargaining: 1, blackSwanDiscovery: 6,
      },
      {
        id: "r2", overallScore: 8,
        tacticalEmpathy: 6, mirroring: 8, labeling: 6,
        calibratedQuestions: 7, thatsRight: 5, usingNo: 5,
        accusationAudit: 4, lossFraming: 7, ackermanBargaining: 3, blackSwanDiscovery: 4,
      },
    ]);
    mockDb.practiceSession.findMany.mockResolvedValue([
      { id: "p1", drillType: "mirror", score: 9, rounds: 3 },
    ]);

    const res = await GET();
    const data = await readJson(res);
    expect(data.totalCalls).toBe(2);
    expect(data.avgOverall).toBe(7);
    expect(data.dimensionAverages.tacticalEmpathy).toBe(7);
    expect(data.dimensionAverages.mirroring).toBe(6);
    expect(data.weakest.key).toBe("ackermanBargaining");
    expect(data.totalPracticeSessions).toBe(1);
  });
});
