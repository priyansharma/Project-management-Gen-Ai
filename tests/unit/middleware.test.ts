import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock next-auth/jwt
vi.mock("next-auth/jwt", () => ({
  getToken: vi.fn(),
}));

import { getToken } from "next-auth/jwt";
import { middleware } from "@/middleware";

const mockedGetToken = vi.mocked(getToken);

function createRequest(path: string, baseUrl = "http://localhost:3000"): NextRequest {
  return new NextRequest(new URL(path, baseUrl));
}

describe("Route Protection Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Public paths (no auth required)", () => {
    it("allows access to /login without authentication", async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createRequest("/login");
      const response = await middleware(request);

      // Should pass through (NextResponse.next())
      expect(response.status).toBe(200);
      expect(response.headers.get("x-middleware-next")).toBe("1");
    });

    it("allows access to /register without authentication", async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createRequest("/register");
      const response = await middleware(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("x-middleware-next")).toBe("1");
    });

    it("allows access to /api/auth/* routes without authentication", async () => {
      mockedGetToken.mockResolvedValue(null);

      const authPaths = [
        "/api/auth/register",
        "/api/auth/login",
        "/api/auth/logout",
        "/api/auth/session",
        "/api/auth/callback/credentials",
      ];

      for (const path of authPaths) {
        const request = createRequest(path);
        const response = await middleware(request);
        expect(response.status).toBe(200);
        expect(response.headers.get("x-middleware-next")).toBe("1");
      }
    });

    it("allows access to /favicon.ico without authentication", async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createRequest("/favicon.ico");
      const response = await middleware(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("x-middleware-next")).toBe("1");
    });
  });

  describe("Protected API routes (unauthenticated)", () => {
    it("returns 401 JSON for unauthenticated API requests", async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createRequest("/api/projects");
      const response = await middleware(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({
        success: false,
        message: "Please log in to continue",
      });
    });

    it("returns 401 for /api/dashboard without token", async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createRequest("/api/dashboard");
      const response = await middleware(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.success).toBe(false);
    });

    it("returns 401 for /api/tasks without token", async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createRequest("/api/tasks");
      const response = await middleware(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.message).toBeDefined();
    });
  });

  describe("Protected page routes (unauthenticated)", () => {
    it("redirects unauthenticated users to /login with callbackUrl", async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createRequest("/dashboard");
      const response = await middleware(request);

      expect(response.status).toBe(307);
      const location = response.headers.get("location");
      expect(location).toContain("/login");
      expect(location).toContain("callbackUrl=%2Fdashboard");
    });

    it("preserves the original URL path in callbackUrl", async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createRequest("/projects/some-uuid");
      const response = await middleware(request);

      expect(response.status).toBe(307);
      const location = response.headers.get("location");
      expect(location).toContain("callbackUrl=%2Fprojects%2Fsome-uuid");
    });

    it("redirects /tasks to login for unauthenticated user", async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createRequest("/tasks");
      const response = await middleware(request);

      expect(response.status).toBe(307);
      const location = response.headers.get("location");
      expect(location).toContain("/login");
      expect(location).toContain("callbackUrl=%2Ftasks");
    });
  });

  describe("Authenticated requests", () => {
    it("allows authenticated users to access protected pages", async () => {
      mockedGetToken.mockResolvedValue({
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
      } as any);
      const request = createRequest("/dashboard");
      const response = await middleware(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("x-middleware-next")).toBe("1");
    });

    it("allows authenticated users to access protected API routes", async () => {
      mockedGetToken.mockResolvedValue({
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
      } as any);
      const request = createRequest("/api/projects");
      const response = await middleware(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("x-middleware-next")).toBe("1");
    });

    it("allows authenticated users to access public routes too", async () => {
      mockedGetToken.mockResolvedValue({
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
      } as any);
      const request = createRequest("/login");
      const response = await middleware(request);

      // Public routes should pass through regardless of auth status
      expect(response.status).toBe(200);
      expect(response.headers.get("x-middleware-next")).toBe("1");
    });
  });
});
