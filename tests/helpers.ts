import { vi } from "vitest";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin";
import { rateLimit } from "@/lib/rate-limit";

// Cast to mocked types
const mockAuth = vi.mocked(auth);
const mockRequireAdmin = vi.mocked(requireAdmin);
const mockRateLimit = vi.mocked(rateLimit);

/** Create a mock NextRequest with JSON body */
export function mockJsonRequest(
  body: unknown,
  options: { method?: string; url?: string } = {}
): NextRequest {
  const { method = "POST", url = "http://localhost:3000/api/test" } = options;
  return new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Create a mock GET request */
export function mockGetRequest(url = "http://localhost:3000/api/test"): NextRequest {
  return new NextRequest(url, { method: "GET" });
}

/** Set up auth mock to return a valid session */
export function mockAuthSession(
  overrides: { id?: string; email?: string } = {}
) {
  const { id = "user-123", email = "test@example.com" } = overrides;
  mockAuth.mockResolvedValue({
    user: { id, email },
    expires: new Date(Date.now() + 86400000).toISOString(),
  } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
}

/** Set up auth mock to return no session (unauthenticated) */
export function mockNoAuth() {
  mockAuth.mockResolvedValue(null as never);
}

/** Set up admin mock to return a valid admin session */
export function mockAdminSession(
  overrides: { email?: string } = {}
) {
  const { email = "admin@example.com" } = overrides;
  mockRequireAdmin.mockResolvedValue({
    user: { id: "admin-1", email },
    expires: new Date(Date.now() + 86400000).toISOString(),
  } as never);
}

/** Set up admin mock to deny access */
export function mockNoAdmin() {
  mockRequireAdmin.mockResolvedValue(null);
}

/** Block rate limiter */
export function mockRateLimited() {
  mockRateLimit.mockReturnValueOnce({ allowed: false, remaining: 0 });
}

/** Helper to read JSON from a Response */
export async function readJson(res: Response) {
  return res.json();
}
