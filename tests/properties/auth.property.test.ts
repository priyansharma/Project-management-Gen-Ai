import { describe, expect, vi, beforeEach } from "vitest";
import { test, fc } from "@fast-check/vitest";

// Feature: project-tracker, Property 1: Registration produces valid user with hashed password
// Feature: project-tracker, Property 3: Login round trip
// Feature: project-tracker, Property 4: Logout idempotence
// Feature: project-tracker, Property 5: Route protection for unauthenticated requests
// **Validates: Requirements 1.1, 1.4, 2.1, 3.1, 3.4, 4.1, 4.2**

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock bcrypt
vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

// Mock next-auth/jwt
vi.mock("next-auth/jwt", () => ({
  encode: vi.fn(),
  decode: vi.fn(),
  getToken: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { encode, decode, getToken } from "next-auth/jwt";
import { authService } from "@/services/auth.service";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";

const mockPrisma = prisma as unknown as {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
};

const mockBcrypt = bcrypt as unknown as {
  hash: ReturnType<typeof vi.fn>;
  compare: ReturnType<typeof vi.fn>;
};

const mockEncode = encode as ReturnType<typeof vi.fn>;
const mockDecode = decode as ReturnType<typeof vi.fn>;
const mockGetToken = getToken as ReturnType<typeof vi.fn>;

// Helper: generate valid name (1-100 non-empty chars, no HTML)
const validName = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0 && !/<[^>]*>/.test(s));

// Helper: generate valid email addresses
const validEmail = fc.emailAddress().filter((e) => e.length <= 255);

// Helper: generate valid password (8-128 chars)
const validPassword = fc.string({ minLength: 8, maxLength: 128 });

// UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// bcrypt hash format: $2b$NN$ followed by 53 chars (22 salt + 31 hash)
const BCRYPT_REGEX = /^\$2[aby]\$\d{1,2}\$.+$/;

describe("Property 1: Registration produces valid user with hashed password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authService.clearInvalidatedTokens();
  });

  test.prop(
    [validName, validEmail, validPassword],
    { numRuns: 100 }
  )(
    "for any valid registration input, created user has UUID id, provided name/email, and bcrypt-hashed password",
    async (name, email, password) => {
      const fakeUuid = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
      const fakeHash = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

      // Setup mocks
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue(fakeHash);
      mockPrisma.user.create.mockImplementation(async ({ data, select }: any) => {
        return {
          id: fakeUuid,
          name: data.name,
          email: data.email,
        };
      });

      const result = await authService.register({ name, email, password });

      // 1. The created user has a UUID id
      expect(result.id).toBe(fakeUuid);
      expect(result.id).toMatch(UUID_REGEX);

      // 2. The returned user has the provided name and email (sanitized)
      expect(result.name).toBeDefined();
      expect(result.email).toBeDefined();
      expect(typeof result.name).toBe("string");
      expect(typeof result.email).toBe("string");

      // 3. bcrypt.hash was called with the password (not stored as plaintext)
      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 10);

      // 4. The password stored in the database is a bcrypt hash, not the plaintext
      const createCall = mockPrisma.user.create.mock.calls[0][0];
      expect(createCall.data.password).toBe(fakeHash);
      expect(createCall.data.password).not.toBe(password);
      expect(createCall.data.password).toMatch(BCRYPT_REGEX);
    }
  );
});

describe("Property 3: Login round trip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authService.clearInvalidatedTokens();
  });

  test.prop(
    [validName, validEmail, validPassword],
    { numRuns: 100 }
  )(
    "for any registered user, correct credentials yield a 200 with token having 24h expiry",
    async (name, email, password) => {
      const fakeHash = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
      const fakeUserId = "user-" + email.slice(0, 8);
      const fakeToken = "jwt-token-" + Date.now();

      // Mock: user exists in database with bcrypt-hashed password
      mockPrisma.user.findUnique.mockResolvedValue({
        id: fakeUserId,
        name,
        email,
        password: fakeHash,
      });

      // Mock: bcrypt.compare returns true (correct password)
      mockBcrypt.compare.mockResolvedValue(true);

      // Mock: JWT encode produces a token with the correct maxAge
      mockEncode.mockResolvedValue(fakeToken);

      const result = await authService.login({ email, password });

      // 1. Login returns a token
      expect(result.token).toBe(fakeToken);
      expect(typeof result.token).toBe("string");
      expect(result.token.length).toBeGreaterThan(0);

      // 2. Login returns user info
      expect(result.user).toEqual({
        id: fakeUserId,
        name,
        email,
      });

      // 3. JWT encode was called with 24h (86400s) maxAge
      expect(mockEncode).toHaveBeenCalledWith(
        expect.objectContaining({
          maxAge: 24 * 60 * 60,
        })
      );
    }
  );
});

describe("Property 4: Logout idempotence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authService.clearInvalidatedTokens();
  });

  test.prop(
    [
      // Generate a random token string and a number of logout calls (1-10)
      fc.string({ minLength: 10, maxLength: 100 }),
      fc.integer({ min: 1, max: 10 }),
    ],
    { numRuns: 100 }
  )(
    "calling logout N times always succeeds and session is invalid after first call",
    async (token, n) => {
      // Call logout N times — should never throw
      for (let i = 0; i < n; i++) {
        await expect(authService.logout(token)).resolves.toBeUndefined();
      }

      // After the first call, the token should be invalidated
      expect(authService.isTokenInvalidated(token)).toBe(true);
    }
  );
});

describe("Property 5: Route protection for unauthenticated requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Protected API endpoints
  const protectedApiPaths = fc.constantFrom(
    "/api/projects",
    "/api/projects/some-id",
    "/api/tasks",
    "/api/tasks/some-id",
    "/api/dashboard"
  );

  // Protected page paths
  const protectedPagePaths = fc.constantFrom(
    "/dashboard",
    "/projects",
    "/projects/some-id",
    "/tasks"
  );

  test.prop(
    [protectedApiPaths],
    { numRuns: 100 }
  )(
    "any protected API endpoint without valid token returns 401",
    async (path) => {
      // Mock: no valid token (unauthenticated)
      mockGetToken.mockResolvedValue(null);

      const request = new NextRequest(new URL(path, "http://localhost:3000"));
      const response = await middleware(request);

      // Must return 401
      expect(response.status).toBe(401);

      // Must return JSON with success: false
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(typeof body.message).toBe("string");
      expect(body.message.length).toBeGreaterThan(0);
    }
  );

  test.prop(
    [protectedPagePaths],
    { numRuns: 100 }
  )(
    "any protected page without valid token redirects to /login with callbackUrl",
    async (path) => {
      // Mock: no valid token (unauthenticated)
      mockGetToken.mockResolvedValue(null);

      const request = new NextRequest(new URL(path, "http://localhost:3000"));
      const response = await middleware(request);

      // Must redirect (307)
      expect(response.status).toBe(307);

      // Must redirect to /login with callbackUrl
      const location = response.headers.get("location");
      expect(location).toContain("/login");
      expect(location).toContain("callbackUrl=");
      expect(location).toContain(encodeURIComponent(path));
    }
  );
});
