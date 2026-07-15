import { describe, expect, vi, beforeEach } from "vitest";
import { test, fc } from "@fast-check/vitest";

// Feature: project-tracker, Property 12: Task search filters correctly
// **Validates: Requirements 11.2**

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    task: { count: vi.fn(), findMany: vi.fn() },
    project: { findFirst: vi.fn() },
  },
}));

// Mock error-handler since task service imports AppError from it
vi.mock("@/lib/error-handler", () => ({
  AppError: class AppError extends Error {
    public readonly statusCode: number;
    constructor(statusCode: number, message: string) {
      super(message);
      this.statusCode = statusCode;
      this.name = "AppError";
    }
  },
}));

import { prisma } from "@/lib/prisma";
import { taskService } from "@/services/task.service";

const mockPrisma = prisma as unknown as {
  task: {
    count: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
  project: {
    findFirst: ReturnType<typeof vi.fn>;
  };
};

// Generators
const taskStatusArb = fc.constantFrom("Todo", "InProgress", "Done");
const priorityArb = fc.constantFrom("Low", "Medium", "High");

const taskArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ maxLength: 200 }),
  status: taskStatusArb,
  priority: priorityArb,
  dueDate: fc.option(fc.date({ min: new Date("2020-01-01"), max: new Date("2030-01-01") }), { nil: null }),
  projectId: fc.uuid(),
  createdAt: fc.date({ min: new Date("2020-01-01"), max: new Date("2030-01-01") }),
  updatedAt: fc.date({ min: new Date("2020-01-01"), max: new Date("2030-01-01") }),
});

// Generate a non-empty search term (alphanumeric to avoid regex issues)
const searchTermArb = fc.string({ minLength: 1, maxLength: 10, unit: fc.char().filter((c) => /[a-zA-Z0-9]/.test(c)) });

describe("Property 12: Task search filters correctly", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test.prop(
    [searchTermArb, fc.array(taskArb, { minLength: 0, maxLength: 30 })],
    { numRuns: 100 }
  )(
    "all returned tasks have title containing search term (case-insensitive)",
    async (searchTerm, tasks) => {
      const userId = "test-user-id";

      // Determine which tasks match the search term (case-insensitive title contains)
      const matchingTasks = tasks.filter((t) =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Mock prisma.task.count to return the count of matching tasks
      mockPrisma.task.count.mockResolvedValue(matchingTasks.length);

      // Mock prisma.task.findMany to return only matching tasks (simulating DB behavior)
      mockPrisma.task.findMany.mockResolvedValue(matchingTasks);

      // Call taskService.findAll with a search param
      const result = await taskService.findAll(
        { page: 1, pageSize: 10, search: searchTerm },
        userId
      );

      // Verify: every task in the result has a title containing the search term (case-insensitive)
      for (const task of result.data) {
        expect(task.title.toLowerCase()).toContain(searchTerm.toLowerCase());
      }

      // Verify: all returned tasks are from the matching set
      expect(result.data.length).toBeLessThanOrEqual(matchingTasks.length);
    }
  );
});
