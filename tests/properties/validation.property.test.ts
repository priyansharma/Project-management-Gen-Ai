import { describe, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { registerSchema, loginSchema } from "@/validators/auth.schema";
import {
  createProjectSchema,
  updateProjectSchema,
  projectListParamsSchema,
} from "@/validators/project.schema";
import {
  createTaskSchema,
  updateTaskSchema,
  taskListParamsSchema,
} from "@/validators/task.schema";
import { ZodError } from "zod";

// Feature: project-tracker, Property 2: Invalid input rejection with field-level errors
// **Validates: Requirements 1.3, 2.3, 6.3, 6.4, 10.4, 10.5, 13.1, 13.2**

describe("Property 2: Invalid input rejection with field-level errors", () => {
  // Helper: parse and assert validation fails with field-level errors
  function assertValidationFails(schema: { safeParse: (data: unknown) => { success: boolean; error?: ZodError } }, input: unknown) {
    const result = schema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ZodError);
      expect(result.error!.errors.length).toBeGreaterThan(0);
      // Each error should have a path (field indicator) and a message
      for (const err of result.error!.errors) {
        expect(Array.isArray(err.path)).toBe(true);
        expect(typeof err.message).toBe("string");
        expect(err.message.length).toBeGreaterThan(0);
      }
    }
  }

  // 2a: registerSchema rejects invalid inputs
  test.prop(
    [
      fc.oneof(
        // Missing name (empty string)
        fc.record({
          name: fc.constant(""),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 128 }),
        }),
        // Name too long (> 100 chars)
        fc.record({
          name: fc.string({ minLength: 101, maxLength: 150 }),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 128 }),
        }),
        // Invalid email format
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          email: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes("@") || !s.includes(".")),
          password: fc.string({ minLength: 8, maxLength: 128 }),
        }),
        // Password too short (< 8 chars)
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 7 }),
        }),
        // Completely empty object
        fc.constant({}),
        // Non-object types
        fc.oneof(fc.constant(null), fc.constant(undefined), fc.integer(), fc.constant("string"))
      ),
    ],
    { numRuns: 100 }
  )(
    "registerSchema rejects any invalid input with field-level errors",
    (invalidInput) => {
      assertValidationFails(registerSchema, invalidInput);
    }
  );

  // 2b: loginSchema rejects invalid inputs
  test.prop(
    [
      fc.oneof(
        // Invalid email format
        fc.record({
          email: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes("@") || !s.includes(".")),
          password: fc.string({ minLength: 8, maxLength: 128 }),
        }),
        // Password too short
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 7 }),
        }),
        // Missing fields
        fc.constant({}),
        // Non-object types
        fc.oneof(fc.constant(null), fc.constant(undefined), fc.integer())
      ),
    ],
    { numRuns: 100 }
  )(
    "loginSchema rejects any invalid input with field-level errors",
    (invalidInput) => {
      assertValidationFails(loginSchema, invalidInput);
    }
  );

  // 2c: createProjectSchema rejects invalid inputs
  test.prop(
    [
      fc.oneof(
        // Missing name (empty string)
        fc.record({
          name: fc.constant(""),
          priority: fc.constantFrom("Low", "Medium", "High"),
        }),
        // Name too long (> 255 chars)
        fc.record({
          name: fc.string({ minLength: 256, maxLength: 300 }),
          priority: fc.constantFrom("Low", "Medium", "High"),
        }),
        // Invalid status enum
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 255 }),
          priority: fc.constantFrom("Low", "Medium", "High"),
          status: fc.string({ minLength: 1, maxLength: 20 }).filter(
            (s) => !["Planned", "Active", "Completed"].includes(s)
          ),
        }),
        // Invalid priority enum
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 255 }),
          priority: fc.string({ minLength: 1, maxLength: 20 }).filter(
            (s) => !["Low", "Medium", "High"].includes(s)
          ),
        }),
        // Progress out of range (> 100)
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 255 }),
          priority: fc.constantFrom("Low", "Medium", "High"),
          progress: fc.integer({ min: 101, max: 1000 }),
        }),
        // Progress out of range (< 0)
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 255 }),
          priority: fc.constantFrom("Low", "Medium", "High"),
          progress: fc.integer({ min: -1000, max: -1 }),
        }),
        // Missing required priority
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 255 }),
        }),
        // Completely empty object
        fc.constant({})
      ),
    ],
    { numRuns: 100 }
  )(
    "createProjectSchema rejects any invalid input with field-level errors",
    (invalidInput) => {
      assertValidationFails(createProjectSchema, invalidInput);
    }
  );

  // 2d: createTaskSchema rejects invalid inputs
  test.prop(
    [
      fc.oneof(
        // Missing title (empty string)
        fc.record({
          title: fc.constant(""),
          status: fc.constantFrom("Todo", "InProgress", "Done"),
          priority: fc.constantFrom("Low", "Medium", "High"),
          projectId: fc.uuid(),
        }),
        // Title too long (> 255 chars)
        fc.record({
          title: fc.string({ minLength: 256, maxLength: 300 }),
          status: fc.constantFrom("Todo", "InProgress", "Done"),
          priority: fc.constantFrom("Low", "Medium", "High"),
          projectId: fc.uuid(),
        }),
        // Invalid status enum
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 255 }),
          status: fc.string({ minLength: 1, maxLength: 20 }).filter(
            (s) => !["Todo", "InProgress", "Done"].includes(s)
          ),
          priority: fc.constantFrom("Low", "Medium", "High"),
          projectId: fc.uuid(),
        }),
        // Invalid priority enum
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 255 }),
          status: fc.constantFrom("Todo", "InProgress", "Done"),
          priority: fc.string({ minLength: 1, maxLength: 20 }).filter(
            (s) => !["Low", "Medium", "High"].includes(s)
          ),
          projectId: fc.uuid(),
        }),
        // Invalid projectId (not UUID)
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 255 }),
          status: fc.constantFrom("Todo", "InProgress", "Done"),
          priority: fc.constantFrom("Low", "Medium", "High"),
          projectId: fc.string({ minLength: 1, maxLength: 50 }).filter(
            (s) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
          ),
        }),
        // Description too long (> 1024 chars)
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 255 }),
          status: fc.constantFrom("Todo", "InProgress", "Done"),
          priority: fc.constantFrom("Low", "Medium", "High"),
          projectId: fc.uuid(),
          description: fc.string({ minLength: 1025, maxLength: 1100 }),
        }),
        // Missing required fields
        fc.constant({}),
        // Missing status
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 255 }),
          priority: fc.constantFrom("Low", "Medium", "High"),
          projectId: fc.uuid(),
        })
      ),
    ],
    { numRuns: 100 }
  )(
    "createTaskSchema rejects any invalid input with field-level errors",
    (invalidInput) => {
      assertValidationFails(createTaskSchema, invalidInput);
    }
  );

  // 2e: projectListParamsSchema rejects invalid inputs
  test.prop(
    [
      fc.oneof(
        // page < 1
        fc.record({
          page: fc.integer({ min: -100, max: 0 }),
        }),
        // pageSize > 50
        fc.record({
          pageSize: fc.integer({ min: 51, max: 200 }),
        }),
        // pageSize < 1
        fc.record({
          pageSize: fc.integer({ min: -100, max: 0 }),
        }),
        // Invalid status enum
        fc.record({
          status: fc.string({ minLength: 1, maxLength: 20 }).filter(
            (s) => !["Planned", "Active", "Completed"].includes(s)
          ),
        })
      ),
    ],
    { numRuns: 100 }
  )(
    "projectListParamsSchema rejects invalid params with field-level errors",
    (invalidInput) => {
      assertValidationFails(projectListParamsSchema, invalidInput);
    }
  );

  // 2f: taskListParamsSchema rejects invalid inputs
  test.prop(
    [
      fc.oneof(
        // page < 1
        fc.record({
          page: fc.integer({ min: -100, max: 0 }),
        }),
        // pageSize > 50
        fc.record({
          pageSize: fc.integer({ min: 51, max: 200 }),
        }),
        // pageSize < 1
        fc.record({
          pageSize: fc.integer({ min: -100, max: 0 }),
        }),
        // Invalid status enum
        fc.record({
          status: fc.string({ minLength: 1, maxLength: 20 }).filter(
            (s) => !["Todo", "InProgress", "Done"].includes(s)
          ),
        }),
        // Invalid priority enum
        fc.record({
          priority: fc.string({ minLength: 1, maxLength: 20 }).filter(
            (s) => !["Low", "Medium", "High"].includes(s)
          ),
        })
      ),
    ],
    { numRuns: 100 }
  )(
    "taskListParamsSchema rejects invalid params with field-level errors",
    (invalidInput) => {
      assertValidationFails(taskListParamsSchema, invalidInput);
    }
  );
});

// Feature: project-tracker, Property 9: Date constraint enforcement
// **Validates: Requirements 6.5**

describe("Property 9: Date constraint enforcement", () => {
  // Helper to generate valid ISO datetime strings from a Date
  const dateToISO = (d: Date) => d.toISOString();

  // 9a: endDate < startDate is always rejected
  test.prop(
    [
      // Generate a start date, then generate an end date that is strictly before it
      fc.date({ min: new Date("2020-01-02"), max: new Date("2030-12-31") }).chain((startDate) =>
        fc.date({ min: new Date("2000-01-01"), max: new Date(startDate.getTime() - 86400000) }).map((endDate) => ({
          startDate,
          endDate,
        }))
      ),
      fc.constantFrom("Low", "Medium", "High") as fc.Arbitrary<string>,
    ],
    { numRuns: 100 }
  )(
    "createProjectSchema rejects when endDate < startDate",
    ({ startDate, endDate }, priority) => {
      const input = {
        name: "Test Project",
        priority,
        startDate: dateToISO(startDate),
        endDate: dateToISO(endDate),
      };

      const result = createProjectSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Should have an error on the endDate path
        const endDateError = result.error.errors.find(
          (e) => e.path.includes("endDate")
        );
        expect(endDateError).toBeDefined();
        expect(endDateError!.message).toContain("End date must be equal to or later than start date");
      }
    }
  );

  // 9b: endDate >= startDate always passes validation (given all other fields are valid)
  test.prop(
    [
      // Generate a start date, then generate an end date that is equal to or after it
      fc.date({ min: new Date("2020-01-01"), max: new Date("2029-12-31") }).chain((startDate) =>
        fc.date({ min: startDate, max: new Date("2030-12-31") }).map((endDate) => ({
          startDate,
          endDate,
        }))
      ),
      fc.constantFrom("Low", "Medium", "High") as fc.Arbitrary<string>,
    ],
    { numRuns: 100 }
  )(
    "createProjectSchema accepts when endDate >= startDate",
    ({ startDate, endDate }, priority) => {
      const input = {
        name: "Test Project",
        priority,
        startDate: dateToISO(startDate),
        endDate: dateToISO(endDate),
      };

      const result = createProjectSchema.safeParse(input);
      expect(result.success).toBe(true);
    }
  );

  // 9c: updateProjectSchema also rejects endDate < startDate
  test.prop(
    [
      fc.date({ min: new Date("2020-01-02"), max: new Date("2030-12-31") }).chain((startDate) =>
        fc.date({ min: new Date("2000-01-01"), max: new Date(startDate.getTime() - 86400000) }).map((endDate) => ({
          startDate,
          endDate,
        }))
      ),
    ],
    { numRuns: 100 }
  )(
    "updateProjectSchema rejects when endDate < startDate",
    ({ startDate, endDate }) => {
      const input = {
        startDate: dateToISO(startDate),
        endDate: dateToISO(endDate),
      };

      const result = updateProjectSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const endDateError = result.error.errors.find(
          (e) => e.path.includes("endDate")
        );
        expect(endDateError).toBeDefined();
      }
    }
  );

  // 9d: updateProjectSchema passes when endDate >= startDate
  test.prop(
    [
      fc.date({ min: new Date("2020-01-01"), max: new Date("2029-12-31") }).chain((startDate) =>
        fc.date({ min: startDate, max: new Date("2030-12-31") }).map((endDate) => ({
          startDate,
          endDate,
        }))
      ),
    ],
    { numRuns: 100 }
  )(
    "updateProjectSchema accepts when endDate >= startDate",
    ({ startDate, endDate }) => {
      const input = {
        startDate: dateToISO(startDate),
        endDate: dateToISO(endDate),
      };

      const result = updateProjectSchema.safeParse(input);
      expect(result.success).toBe(true);
    }
  );
});
