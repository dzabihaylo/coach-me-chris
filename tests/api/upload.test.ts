import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockAuthSession, mockNoAuth, readJson } from "../helpers";
import { NextRequest } from "next/server";

import { POST } from "@/app/api/upload/route";

// Mock global fetch for Deepgram calls
const originalFetch = globalThis.fetch;

function makeFileRequest(
  file: File,
): NextRequest {
  const form = new FormData();
  form.append("file", file);
  return new NextRequest("http://localhost/api/upload", {
    method: "POST",
    body: form,
  });
}

describe("POST /api/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DEEPGRAM_API_KEY = "test-key";
    // Restore fetch after each test
    globalThis.fetch = originalFetch;
  });

  it("returns 401 when unauthenticated", async () => {
    mockNoAuth();
    const file = new File(["audio"], "test.mp3", { type: "audio/mpeg" });
    const res = await POST(makeFileRequest(file));
    expect(res.status).toBe(401);
  });

  it("returns 503 when Deepgram not configured", async () => {
    mockAuthSession();
    delete process.env.DEEPGRAM_API_KEY;
    const file = new File(["audio"], "test.mp3", { type: "audio/mpeg" });
    const res = await POST(makeFileRequest(file));
    expect(res.status).toBe(503);
  });

  it("returns 400 for no file", async () => {
    mockAuthSession();
    const req = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      body: new FormData(),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for unsupported file type", async () => {
    mockAuthSession();
    const file = new File(["data"], "test.txt", { type: "text/plain" });
    const res = await POST(makeFileRequest(file));
    expect(res.status).toBe(400);
    const data = await readJson(res);
    expect(data.error).toContain("Unsupported file type");
  });

  it("transcribes audio file via Deepgram", async () => {
    mockAuthSession();

    // Mock the Deepgram API fetch
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          results: {
            utterances: [
              { speaker: 0, transcript: "Hello there" },
              { speaker: 1, transcript: "Hi, nice to meet you" },
            ],
            channels: [{ alternatives: [{ words: new Array(10) }] }],
          },
          metadata: { duration: 120 },
        }),
    });

    const file = new File(["fake-audio"], "call.mp3", { type: "audio/mpeg" });
    const res = await POST(makeFileRequest(file));
    const data = await readJson(res);

    expect(res.status).toBe(200);
    expect(data.transcript).toContain("Speaker 1:");
    expect(data.transcript).toContain("Speaker 2:");
    expect(data.durationMinutes).toBe(2);
    expect(data.speakerCount).toBe(2);
  });
});
