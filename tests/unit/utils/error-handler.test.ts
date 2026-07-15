import { describe, it, expect, vi } from "vitest";
import { ZodError, ZodIssueCode } from "zod";
import { handleApiError, AppError } from "@/lib/error-handler";
import { Prisma } from "@prisma/client";

describe("handleApiError", () => {
  it("handles ZodError with field-level errors", async () => {
    const zodError = new ZodError([
      {
        code: ZodIssueCode.too_small,
        minimum: 1,
        type: "string",
        inclusive: true,
        exact: false,
        message: "Name is required",
        path: ["name"],
      },
      {
        code: ZodIssueCode.invalid_string,
        validation: "email",
        message: "Invalid email",
        path: ["email"],
      },
    ]);

    const response = handleApiError(zodError);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toBe("Validation failed");
    expect(body.errors).toHaveLength(2);
    expect(body.errors[0]).toEqual({ field: "name", message: "Name is required" });
    expect(body.errors[1]).toEqual({ field: "email", message: "Invalid email" });
  });

  it("handles AppError with custom status code", async () => {
    const appError = new AppError(404, "Project not found");

    const response = handleApiError(appError);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.message).toBe("Project not found");
  });

  it("handles Prisma P2002 unique constraint error", async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed on the fields: (`email`)",
      { code: "P2002", clientVersion: "6.0.0" }
    );

    const response = handleApiError(prismaError);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toBe("A record with this value already exists");
  });

  it("handles unknown errors with 500 and generic message", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const unknownError = new Error("Something broke internally");

    const response = handleApiError(unknownError);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.message).toBe("An unexpected error occurred");
    expect(body.message).not.toContain("Something broke internally");

    consoleSpy.mockRestore();
  });

  it("500 errors do not expose internal details", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("ECONNREFUSED /var/lib/postgres/socket");

    const response = handleApiError(error);
    const body = await response.json();

    expect(body.message).not.toContain("/var/lib");
    expect(body.message).not.toContain("ECONNREFUSED");
    expect(body.message).not.toContain("postgres");
    expect(body.message).toBe("An unexpected error occurred");

    consoleSpy.mockRestore();
  });
});
