import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService } from "@/services/auth.service";

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
}));

import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { encode, decode } from "next-auth/jwt";

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

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authService.clearInvalidatedTokens();
  });

  describe("register", () => {
    it("should create a user with hashed password and return user info", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue("$2b$10$hashedpassword");
      mockPrisma.user.create.mockResolvedValue({
        id: "uuid-123",
        name: "John Doe",
        email: "john@example.com",
      });

      const result = await authService.register({
        name: "John Doe",
        email: "john@example.com",
        password: "securepass123",
      });

      expect(result).toEqual({
        id: "uuid-123",
        name: "John Doe",
        email: "john@example.com",
      });
      expect(mockBcrypt.hash).toHaveBeenCalledWith("securepass123", 10);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: "John Doe",
          email: "john@example.com",
          password: "$2b$10$hashedpassword",
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
    });

    it("should throw AppError 400 when email already exists", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "existing-id",
        email: "john@example.com",
      });

      await expect(
        authService.register({
          name: "John Doe",
          email: "john@example.com",
          password: "securepass123",
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "A user with this email already exists",
      });
    });

    it("should never store plaintext password", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue("$2b$10$hashed");
      mockPrisma.user.create.mockResolvedValue({
        id: "id",
        name: "Test",
        email: "test@example.com",
      });

      await authService.register({
        name: "Test",
        email: "test@example.com",
        password: "myplaintext",
      });

      const createCall = mockPrisma.user.create.mock.calls[0][0];
      expect(createCall.data.password).not.toBe("myplaintext");
      expect(createCall.data.password).toBe("$2b$10$hashed");
    });
  });

  describe("login", () => {
    it("should return token and user info for valid credentials", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-id",
        name: "Jane",
        email: "jane@example.com",
        password: "$2b$10$hashedpw",
      });
      mockBcrypt.compare.mockResolvedValue(true);
      mockEncode.mockResolvedValue("jwt-token-string");

      const result = await authService.login({
        email: "jane@example.com",
        password: "correctpass",
      });

      expect(result.token).toBe("jwt-token-string");
      expect(result.user).toEqual({
        id: "user-id",
        name: "Jane",
        email: "jane@example.com",
      });
      expect(mockEncode).toHaveBeenCalledWith(
        expect.objectContaining({
          maxAge: 24 * 60 * 60,
        })
      );
    });

    it("should throw 401 when email does not exist", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({
          email: "noone@example.com",
          password: "anypassword",
        })
      ).rejects.toMatchObject({
        statusCode: 401,
        message: "Invalid email or password",
      });
    });

    it("should throw 401 when password is incorrect", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-id",
        name: "Jane",
        email: "jane@example.com",
        password: "$2b$10$hashedpw",
      });
      mockBcrypt.compare.mockResolvedValue(false);

      await expect(
        authService.login({
          email: "jane@example.com",
          password: "wrongpassword",
        })
      ).rejects.toMatchObject({
        statusCode: 401,
        message: "Invalid email or password",
      });
    });

    it("should not reveal whether email or password was wrong", async () => {
      // Both cases should give the same error message
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const error1 = await authService
        .login({ email: "bad@email.com", password: "password123" })
        .catch((e) => e);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: "id",
        name: "User",
        email: "real@email.com",
        password: "$2b$10$hash",
      });
      mockBcrypt.compare.mockResolvedValue(false);

      const error2 = await authService
        .login({ email: "real@email.com", password: "wrongpass1" })
        .catch((e) => e);

      expect(error1.message).toBe(error2.message);
      expect(error1.statusCode).toBe(error2.statusCode);
    });
  });

  describe("logout", () => {
    it("should invalidate a token", async () => {
      await authService.logout("token-to-invalidate");

      expect(authService.isTokenInvalidated("token-to-invalidate")).toBe(true);
    });

    it("should be idempotent — multiple logouts of same token succeed", async () => {
      await authService.logout("same-token");
      await authService.logout("same-token");
      await authService.logout("same-token");

      expect(authService.isTokenInvalidated("same-token")).toBe(true);
    });
  });

  describe("validateSession", () => {
    it("should return user info for valid, non-invalidated token", async () => {
      mockDecode.mockResolvedValue({
        id: "user-id",
        name: "Test User",
        email: "test@example.com",
      });

      const result = await authService.validateSession("valid-token");

      expect(result).toEqual({
        id: "user-id",
        name: "Test User",
        email: "test@example.com",
      });
    });

    it("should return null for invalidated token", async () => {
      await authService.logout("invalidated-token");

      const result = await authService.validateSession("invalidated-token");

      expect(result).toBeNull();
    });

    it("should return null when decode fails", async () => {
      mockDecode.mockRejectedValue(new Error("Invalid token"));

      const result = await authService.validateSession("bad-token");

      expect(result).toBeNull();
    });

    it("should return null when decoded token lacks required fields", async () => {
      mockDecode.mockResolvedValue({ id: "user-id" }); // missing name and email

      const result = await authService.validateSession("incomplete-token");

      expect(result).toBeNull();
    });
  });
});
