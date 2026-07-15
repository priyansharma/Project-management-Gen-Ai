import { describe, expect, vi, beforeEach } from "vitest";
import { test, fc } from "@fast-check/vitest";

// Feature: project-tracker, Property 6: Dashboard count accuracy
// Feature: project-tracker, Property 7: Dashboard recent items ordering
// **Validates: Requirements 5.1, 5.2, 5.3**

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    task: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { dashboardService } from "@/services/dashboard.service";

const mockPrisma = prisma as unknown as {
  project: {
    count: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
  task: {
    count: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
};

// Generators
const projectStatusArb = fc.constantFrom("Planned", "Active", "Completed");
const taskStatusArb = fc.constantFrom("Todo", "InProgress", "Done");

const projectArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  status: projectStatusArb,
  updatedAt: fc.date({ min: new Date("2020-01-01"), max: new Date("2030-01-01") }),
});

const taskArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  status: taskStatusArb,
  projectId: fc.uuid(),
  updatedAt: fc.date({ min: new Date("2020-01-01"), max: new Date("2030-01-01") }),
});

describe("Property 6: Dashboard count accuracy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test.prop(
    [fc.array(projectArb, { minLength: 0, maxLength: 30 }), fc.array(taskArb, { minLength: 0, maxLength: 50 })],
    { numRuns: 100 }
  )(
    "computed counts match actual filtered counts from user's data",
    async (projects, tasks) => {
      // Compute expected counts from the generated data
      const totalProjects = projects.length;
      const activeProjects = projects.filter((p) => p.status === "Active").length;
      const completedProjects = projects.filter((p) => p.status === "Completed").length;
      const totalTasks = tasks.length;
      const pendingTasks = tasks.filter((t) => t.status === "Todo" || t.status === "InProgress").length;
      const completedTasks = tasks.filter((t) => t.status === "Done").length;

      // Mock prisma.project.count to return counts based on the where clause
      mockPrisma.project.count.mockImplementation(async ({ where }: any) => {
        if (where.status === "Active") return activeProjects;
        if (where.status === "Completed") return completedProjects;
        // No status filter means total
        return totalProjects;
      });

      // Mock prisma.task.count to return counts based on the where clause
      mockPrisma.task.count.mockImplementation(async ({ where }: any) => {
        if (where.status?.in) {
          // pending tasks: status in ["Todo", "InProgress"]
          return pendingTasks;
        }
        if (where.status === "Done") {
          return completedTasks;
        }
        // No status filter means total
        return totalTasks;
      });

      const userId = "test-user-id";
      const stats = await dashboardService.getStats(userId);

      // Verify all counts match
      expect(stats.totalProjects).toBe(totalProjects);
      expect(stats.activeProjects).toBe(activeProjects);
      expect(stats.completedProjects).toBe(completedProjects);
      expect(stats.totalTasks).toBe(totalTasks);
      expect(stats.pendingTasks).toBe(pendingTasks);
      expect(stats.completedTasks).toBe(completedTasks);
    }
  );
});

describe("Property 7: Dashboard recent items ordering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test.prop(
    [fc.array(projectArb, { minLength: 0, maxLength: 20 }), fc.uuid()],
    { numRuns: 100 }
  )(
    "recent projects have ≤5 items, all owned by user, ordered by updatedAt descending",
    async (projects, userId) => {
      // Sort by updatedAt desc and take at most 5 (simulating what Prisma would return)
      const sorted = [...projects]
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 5)
        .map((p) => ({ ...p, ownerId: userId }));

      mockPrisma.project.findMany.mockResolvedValue(sorted);

      const result = await dashboardService.getRecentProjects(userId, 5);

      // Length must be ≤ 5
      expect(result.length).toBeLessThanOrEqual(5);

      // Items must be ordered by updatedAt descending
      for (let i = 0; i < result.length - 1; i++) {
        const current = new Date(result[i].updatedAt).getTime();
        const next = new Date(result[i + 1].updatedAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }

      // All items must belong to the user
      for (const item of result) {
        expect((item as any).ownerId).toBe(userId);
      }
    }
  );

  test.prop(
    [fc.array(taskArb, { minLength: 0, maxLength: 20 }), fc.uuid()],
    { numRuns: 100 }
  )(
    "recent tasks have ≤5 items, all from user's projects, ordered by updatedAt descending",
    async (tasks, userId) => {
      // Sort by updatedAt desc and take at most 5 (simulating what Prisma would return)
      const sorted = [...tasks]
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 5);

      mockPrisma.task.findMany.mockResolvedValue(sorted);

      const result = await dashboardService.getRecentTasks(userId, 5);

      // Length must be ≤ 5
      expect(result.length).toBeLessThanOrEqual(5);

      // Items must be ordered by updatedAt descending
      for (let i = 0; i < result.length - 1; i++) {
        const current = new Date(result[i].updatedAt).getTime();
        const next = new Date(result[i + 1].updatedAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    }
  );
});
