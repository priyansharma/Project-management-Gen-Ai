import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth service
vi.mock("@/services/auth.service", () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    validateSession: vi.fn(),
    isTokenInvalidated: vi.fn(),
  },
}));

import { authService } from "@/services/auth.service";
import { AppError } from "@/lib/error-handler";

const mockAuthService = authService as unknown as {
  register: ReturnType<typeof vi.fn>;
  login: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
  validateSession: ReturnType<typeof vi.fn>;
  isTokenInvalidated: ReturnType<typeof vi.fn>;
};

// Helper to create a mock NextRequest
function createRequest(body: unknown, headers?: Record<string, string>) {
  const headersMap = new Map(Object.entries(headers || {}));
  return {
    json: body !== null ? () => Promise.resolve(body) : () => Promise.reject(new Error("no body")),
    headers: {
      get: (name: string) => headersMap.get(name) ?? null,
    },
  } as unknown as import("next/server").NextRequest;
}

describe("Auth API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/auth/register", () => {
    let POST: (req: import("next/server").NextRequest) => Promise<import("next/server").NextResponse>;

    beforeEach(async () => {
      const module = await import("@/app/api/auth/register/route");
      POST = module.POST;
    });

    it("should return 201 with user data on successful registration", async () => {
      mockAuthService.register.mockResolvedValue({
        id: "uuid-123",
        name: "John Doe",
        email: "john@example.com",
      });

      const req = createRequest({
        name: "John Doe",
        email: "john@example.com",
        password: "securepass123",
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        id: "uuid-123",
        name: "John Doe",
        email: "john@example.com",
      });
      expect(data.message).toBe("User registered successfully");
    });

    it("should return 400 when email already exists", async () => {
      mockAuthService.register.mockRejectedValue(
        new AppError(400, "A user with this email already exists")
      );

      const req = createRequest({
        name: "John Doe",
        email: "existing@example.com",
        password: "securepass123",
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe("A user with this email already exists");
    });

    it("should return 400 with field-level errors for invalid input", async () => {
      const req = createRequest({
        name: "",
        email: "not-an-email",
        password: "short",
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Validation failed");
      expect(data.errors).toBeDefined();
      expect(Array.isArray(data.errors)).toBe(true);
      expect(data.errors.length).toBeGreaterThan(0);
    });

    it("should return 400 with field error for missing name", async () => {
      const req = createRequest({
        email: "valid@example.com",
        password: "securepass123",
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
      expect(data.errors.some((e: { field: string }) => e.field === "name")).toBe(true);
    });

    it("should return 400 when request body is missing", async () => {
      const req = createRequest(null);

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Request body is missing or malformed");
    });
  });

  describe("POST /api/auth/login", () => {
    let POST: (req: import("next/server").NextRequest) => Promise<import("next/server").NextResponse>;

    beforeEach(async () => {
      const module = await import("@/app/api/auth/login/route");
      POST = module.POST;
    });

    it("should return 200 with token and user data on successful login", async () => {
      mockAuthService.login.mockResolvedValue({
        token: "jwt-token-abc",
        user: { id: "user-1", name: "Jane", email: "jane@example.com" },
      });

      const req = createRequest({
        email: "jane@example.com",
        password: "correctpass1",
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.token).toBe("jwt-token-abc");
      expect(data.data.expiresIn).toBe(86400); // 24 hours
      expect(data.data.user).toEqual({
        id: "user-1",
        name: "Jane",
        email: "jane@example.com",
      });
    });

    it("should return 401 with generic message for invalid credentials", async () => {
      mockAuthService.login.mockRejectedValue(
        new AppError(401, "Invalid email or password")
      );

      const req = createRequest({
        email: "jane@example.com",
        password: "wrongpassword1",
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Invalid email or password");
      // Should NOT reveal which field was incorrect
      expect(data.message).not.toContain("email not found");
      expect(data.message).not.toContain("password incorrect");
    });

    it("should return 400 with field-level errors for invalid form", async () => {
      const req = createRequest({
        email: "not-an-email",
        password: "short",
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Validation failed");
      expect(data.errors).toBeDefined();
      expect(data.errors.length).toBeGreaterThan(0);
    });

    it("should return 400 when request body is missing", async () => {
      const req = createRequest(null);

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Request body is missing or malformed");
    });
  });

  describe("POST /api/auth/logout", () => {
    let POST: (req: import("next/server").NextRequest) => Promise<import("next/server").NextResponse>;

    beforeEach(async () => {
      const module = await import("@/app/api/auth/logout/route");
      POST = module.POST;
    });

    it("should return 200 on successful logout", async () => {
      mockAuthService.isTokenInvalidated.mockReturnValue(false);
      mockAuthService.validateSession.mockResolvedValue({
        id: "user-1",
        name: "Test",
        email: "test@example.com",
      });
      mockAuthService.logout.mockResolvedValue(undefined);

      const req = createRequest({}, { authorization: "Bearer valid-token-123" });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockAuthService.logout).toHaveBeenCalledWith("valid-token-123");
    });

    it("should return 401 when no authorization header is present", async () => {
      const req = createRequest({});

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Authentication required");
    });

    it("should return 401 when token is invalid/expired", async () => {
      mockAuthService.isTokenInvalidated.mockReturnValue(false);
      mockAuthService.validateSession.mockResolvedValue(null);

      const req = createRequest({}, { authorization: "Bearer expired-token" });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Invalid or expired session");
    });

    it("should return 200 for already invalidated token (idempotent)", async () => {
      mockAuthService.isTokenInvalidated.mockReturnValue(true);
      mockAuthService.logout.mockResolvedValue(undefined);

      const req = createRequest({}, { authorization: "Bearer already-logged-out" });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should be idempotent - multiple logout calls return 200", async () => {
      // First call — valid session
      mockAuthService.isTokenInvalidated.mockReturnValue(false);
      mockAuthService.validateSession.mockResolvedValue({
        id: "user-1",
        name: "Test",
        email: "test@example.com",
      });
      mockAuthService.logout.mockResolvedValue(undefined);

      const req1 = createRequest({}, { authorization: "Bearer token-abc" });
      const response1 = await POST(req1);
      expect(response1.status).toBe(200);

      // Second call — token already invalidated
      mockAuthService.isTokenInvalidated.mockReturnValue(true);

      const req2 = createRequest({}, { authorization: "Bearer token-abc" });
      const response2 = await POST(req2);
      expect(response2.status).toBe(200);
    });
  });
});
