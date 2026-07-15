import { describe, expect, vi } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { handleApiError, AppError } from "@/lib/error-handler";
import { ZodError, ZodIssue, ZodIssueCode } from "zod";

// Feature: project-tracker, Property 18: Error response format consistency
// **Validates: Requirements 14.1, 14.2**

describe("Property 18: Error response format consistency", () => {
  // Property 18a: All error responses match { success: false, message: string }
  test.prop(
    [
      fc.oneof(
        // Generate random AppError with 4xx/5xx status codes
        fc.record({
          type: fc.constant("appError" as const),
          statusCode: fc.oneof(
            fc.constantFrom(400, 401, 403, 404, 409, 422),
            fc.constantFrom(500, 502, 503)
          ),
          message: fc.string({ minLength: 1, maxLength: 200 }),
        }),
        // Generate random unknown errors (which become 500)
        fc.record({
          type: fc.constant("unknownError" as const),
          message: fc.string({ minLength: 1, maxLength: 500 }),
        }),
        // Generate ZodError (which becomes 400)
        fc.record({
          type: fc.constant("zodError" as const),
          field: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
          message: fc.string({ minLength: 1, maxLength: 100 }),
        })
      ),
    ],
    { numRuns: 100 }
  )(
    "any error scenario produces a response with { success: false, message: string }",
    async (errorSpec) => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      let error: unknown;
      if (errorSpec.type === "appError") {
        error = new AppError(errorSpec.statusCode, errorSpec.message);
      } else if (errorSpec.type === "unknownError") {
        error = new Error(errorSpec.message);
      } else {
        const issue: ZodIssue = {
          code: ZodIssueCode.custom,
          path: [errorSpec.field],
          message: errorSpec.message,
        };
        error = new ZodError([issue]);
      }

      const response = handleApiError(error);
      const body = await response.json();

      // Content-Type must be application/json
      expect(response.headers.get("content-type")).toContain("application/json");

      // Response must have success: false
      expect(body.success).toBe(false);

      // Response must have a message that is a string
      expect(typeof body.message).toBe("string");
      expect(body.message.length).toBeGreaterThan(0);

      // Status code must be 4xx or 5xx
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(600);

      consoleSpy.mockRestore();
    }
  );

  // Property 18b: 500 responses do not leak internal details
  test.prop(
    [
      fc.oneof(
        // Error messages that contain file paths
        fc.constantFrom(
          "/usr/local/app/src/services/project.service.ts",
          "C:\\Users\\dev\\project\\index.ts",
          "/home/user/.npm/_logs/error.log",
          "at /var/www/app/node_modules/prisma/index.js:42:15"
        ).map((path) => `Error occurred at ${path}`),
        // Error messages that contain stack traces
        fc.constantFrom(
          "TypeError: Cannot read properties of undefined\n    at Object.<anonymous> (/app/src/index.ts:10:5)",
          "Error: ECONNREFUSED\n    at TCPConnectWrap.afterConnect",
          "RangeError: Maximum call stack size exceeded\n    at processTicksAndRejections"
        ),
        // Error messages that contain SQL/database queries
        fc.constantFrom(
          "SELECT * FROM users WHERE email = 'test@test.com'",
          "INSERT INTO projects (name, ownerId) VALUES ($1, $2)",
          "ERROR: relation \"projects\" does not exist",
          "FATAL: password authentication failed for user \"postgres\""
        ),
        // Error messages that contain internal variable names
        fc.constantFrom(
          "prismaClient.project.findUnique failed",
          "Cannot destructure property 'userId' of undefined",
          "this.authService.validateToken is not a function",
          "dbConnection pool exhausted: maxConnections=10"
        ),
        // Random error messages with potentially dangerous content
        fc.string({ minLength: 1, maxLength: 300 })
      ),
    ],
    { numRuns: 100 }
  )(
    "500 error responses do not contain file paths, stack traces, SQL queries, or internal variable names",
    async (errorMessage) => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // All these become unknown errors → 500
      const error = new Error(errorMessage);
      const response = handleApiError(error);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);

      // The message must NOT contain file paths (unix or windows style)
      expect(body.message).not.toMatch(/\/[a-zA-Z_][a-zA-Z0-9_/.-]+\.[a-zA-Z]{1,5}/);
      expect(body.message).not.toMatch(/[A-Z]:\\[^\s]+/);

      // The message must NOT contain stack traces
      expect(body.message).not.toMatch(/at\s+[\w.]+\s*\(/);
      expect(body.message).not.toMatch(/\n\s+at\s+/);

      // The message must NOT contain SQL keywords in query context
      expect(body.message).not.toMatch(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER)\b.*\b(FROM|INTO|SET|TABLE)\b/i);

      // The message must NOT contain common internal variable/class references
      expect(body.message).not.toMatch(/\b(prismaClient|dbConnection|authService)\b/);
      expect(body.message).not.toMatch(/Cannot (read|destructure) propert(y|ies)/);

      consoleSpy.mockRestore();
    }
  );
});
