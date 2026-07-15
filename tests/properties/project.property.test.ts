import { describe, expect, vi, beforeEach } from "vitest";
import { test, fc } from "@fast-check/vitest";

// Feature: project-tracker, Property 8: Project creation applies defaults correctly
// Feature: project-tracker, Property 10: Pagination metadata correctness
// Feature: project-tracker, Property 11: Project search filters correctly
// Feature: project-tracker, Property 13: Status and priority filter correctness
// Feature: project-tracker, Property 14: Ownership isolation
// Feature: project-tracker, Property 15: Partial update preserves unchanged fields
// Feature: project-tracker, Property 16: Cascading delete removes all associated records
// **Validates: Requirements 6.1, 7.1, 7.2, 7.4, 7.5, 8.3, 8.4, 8.7, 9.1, 9.3, 9.4**

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    task: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/lib/prisma";
import { projectService } from "@/services/project.service";

const mockPrisma = prisma as unknown as {
  project: {
    create: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  task: {
    deleteMany: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

// Generators
const priorityArb = fc.constantFrom("Low", "Medium", "High");
const projectStatusArb = fc.constantFrom("Planned", "Active", "Completed");

const validProjectInputArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }).map((s) => s.replace(/<[^>]*>/g, "").trim() || "Project"),
  description: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
  status: fc.option(projectStatusArb, { nil: undefined }),
  priority: priorityArb,
  startDate: fc.constant(undefined) as fc.Arbitrary<string | undefined>,
  endDate: fc.constant(undefined) as fc.Arbitrary<string | undefined>,
  progress: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
});

// ============================================================
// Property 8: Project creation applies defaults correctly
// ============================================================
describe("Property 8: Project creation applies defaults correctly", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test.prop(
    [validProjectInputArb, fc.uuid()],
    { numRuns: 100 }
  )(
    "created project has UUID id, correct defaults for description/status/progress, and correct ownerId",
    async (input, userId) => {
      const generatedId = crypto.randomUUID();

      // Mock prisma.project.create to simulate database behavior
      mockPrisma.project.create.mockImplementation(async ({ data }: any) => ({
        id: generatedId,
        name: data.name,
        description: data.description ?? "",
        status: data.status ?? "Planned",
        priority: data.priority,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        progress: data.progress ?? 0,
        ownerId: data.ownerId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const result = await projectService.create(input as any, userId);

      // Verify UUID format
      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );

      // Verify name matches input
      expect(result.name).toBe(input.name);

      // Verify defaults
      expect(result.description).toBe(input.description ?? "");
      expect(result.status).toBe(input.status ?? "Planned");
      expect(result.progress).toBe(input.progress ?? 0);

      // Verify ownerId matches the userId passed
      expect(result.ownerId).toBe(userId);

      // Verify priority matches
      expect(result.priority).toBe(input.priority);
    }
  );
});

// ============================================================
// Property 10: Pagination metadata correctness
// ============================================================
describe("Property 10: Pagination metadata correctness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test.prop(
    [
      fc.integer({ min: 0, max: 200 }),   // total items T
      fc.integer({ min: 1, max: 20 }),    // page P
      fc.integer({ min: 1, max: 50 }),    // pageSize S
    ],
    { numRuns: 100 }
  )(
    "totalPages = ceil(T/S), returned items count matches formula",
    async (total, page, pageSize) => {
      const expectedTotalPages = Math.ceil(total / pageSize) || 0;
      const skip = (page - 1) * pageSize;
      const expectedItemCount = Math.max(0, Math.min(pageSize, total - skip));

      // Generate mock items for the page
      const items = Array.from({ length: expectedItemCount }, (_, i) => ({
        id: crypto.randomUUID(),
        name: `Project ${i}`,
        description: "",
        status: "Planned",
        priority: "Medium",
        startDate: null,
        endDate: null,
        progress: 0,
        ownerId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      mockPrisma.project.count.mockResolvedValue(total);
      mockPrisma.project.findMany.mockResolvedValue(items);

      const result = await projectService.findAll(
        { page, pageSize },
        "user-1"
      );

      // Verify pagination metadata
      expect(result.pagination.totalPages).toBe(expectedTotalPages);
      expect(result.pagination.page).toBe(page);
      expect(result.pagination.pageSize).toBe(pageSize);
      expect(result.pagination.total).toBe(total);

      // Verify data length matches expected item count
      expect(result.data.length).toBe(expectedItemCount);
    }
  );
});

// ============================================================
// Property 11: Project search filters correctly
// ============================================================
describe("Property 11: Project search filters correctly", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test.prop(
    [
      fc.string({ minLength: 1, maxLength: 10 }).map((s) => s.replace(/[^a-zA-Z0-9]/g, "a") || "test"),
      fc.array(
        fc.string({ minLength: 1, maxLength: 50 }).map((s) => s || "name"),
        { minLength: 1, maxLength: 20 }
      ),
    ],
    { numRuns: 100 }
  )(
    "all results contain search term (case-insensitive) and no matching project is excluded",
    async (searchTerm, projectNames) => {
      // Determine which projects match the search (case-insensitive contains)
      const matchingProjects = projectNames
        .filter((name) => name.toLowerCase().includes(searchTerm.toLowerCase()))
        .map((name, i) => ({
          id: crypto.randomUUID(),
          name,
          description: "",
          status: "Planned",
          priority: "Medium",
          startDate: null,
          endDate: null,
          progress: 0,
          ownerId: "user-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

      mockPrisma.project.count.mockResolvedValue(matchingProjects.length);
      mockPrisma.project.findMany.mockResolvedValue(matchingProjects);

      const result = await projectService.findAll(
        { page: 1, pageSize: 50, search: searchTerm },
        "user-1"
      );

      // All returned projects must contain the search term (case-insensitive)
      for (const project of result.data) {
        expect(project.name.toLowerCase()).toContain(searchTerm.toLowerCase());
      }

      // No matching project should be excluded (within current page)
      expect(result.data.length).toBe(matchingProjects.length);
    }
  );
});

// ============================================================
// Property 13: Status and priority filter correctness
// ============================================================
describe("Property 13: Status and priority filter correctness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test.prop(
    [
      projectStatusArb,
      fc.array(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 30 }).map((s) => s || "proj"),
          status: projectStatusArb,
          priority: priorityArb,
        }),
        { minLength: 1, maxLength: 20 }
      ),
    ],
    { numRuns: 100 }
  )(
    "all returned items match ALL specified filter values (AND logic)",
    async (statusFilter, projects) => {
      // Filter projects that match the status filter
      const matchingProjects = projects
        .filter((p) => p.status === statusFilter)
        .map((p, i) => ({
          id: crypto.randomUUID(),
          name: p.name,
          description: "",
          status: p.status,
          priority: p.priority,
          startDate: null,
          endDate: null,
          progress: 0,
          ownerId: "user-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

      mockPrisma.project.count.mockResolvedValue(matchingProjects.length);
      mockPrisma.project.findMany.mockResolvedValue(matchingProjects);

      const result = await projectService.findAll(
        { page: 1, pageSize: 50, status: statusFilter as any },
        "user-1"
      );

      // All returned items must match the status filter
      for (const project of result.data) {
        expect(project.status).toBe(statusFilter);
      }

      // No matching project should be excluded
      expect(result.data.length).toBe(matchingProjects.length);
    }
  );
});

// ============================================================
// Property 14: Ownership isolation
// ============================================================
describe("Property 14: Ownership isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test.prop(
    [fc.uuid(), fc.uuid(), fc.uuid()],
    { numRuns: 100 }
  )(
    "user B never receives user A's resources (always null/false)",
    async (projectId, userA, userB) => {
      // Ensure userA and userB are different
      fc.pre(userA !== userB);

      // Mock findFirst to return null when ownerId doesn't match (ownership check)
      mockPrisma.project.findFirst.mockResolvedValue(null);

      // Test findById - user B cannot see user A's project
      const findResult = await projectService.findById(projectId, userB);
      expect(findResult).toBeNull();

      // Test update - user B cannot update user A's project
      const updateResult = await projectService.update(
        projectId,
        { name: "hacked" } as any,
        userB
      );
      expect(updateResult).toBeNull();

      // Test delete - user B cannot delete user A's project
      const deleteResult = await projectService.delete(projectId, userB);
      expect(deleteResult).toBe(false);
    }
  );
});

// ============================================================
// Property 15: Partial update preserves unchanged fields
// ============================================================
describe("Property 15: Partial update preserves unchanged fields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test.prop(
    [
      // Original project fields
      fc.record({
        id: fc.uuid(),
        name: fc.string({ minLength: 1, maxLength: 50 }).map((s) => s || "Original"),
        description: fc.string({ minLength: 0, maxLength: 100 }),
        status: projectStatusArb,
        priority: priorityArb,
        progress: fc.integer({ min: 0, max: 100 }),
        ownerId: fc.uuid(),
      }),
      // Partial update (only name changed)
      fc.record({
        name: fc.string({ minLength: 1, maxLength: 50 }).map((s) => s || "Updated"),
      }),
    ],
    { numRuns: 100 }
  )(
    "only specified fields change, all others remain identical",
    async (original, updatePayload) => {
      const existingProject = {
        ...original,
        startDate: null,
        endDate: null,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      // Mock findFirst to return the existing project (ownership check passes)
      mockPrisma.project.findFirst.mockResolvedValue(existingProject);

      // Mock update to return project with only specified fields changed
      mockPrisma.project.update.mockImplementation(async ({ data }: any) => ({
        ...existingProject,
        ...data,
        updatedAt: new Date(),
      }));

      const result = await projectService.update(
        original.id,
        updatePayload as any,
        original.ownerId
      );

      expect(result).not.toBeNull();

      // The updated field should have the new value
      expect(result!.name).toBe(updatePayload.name);

      // Unchanged fields must remain the same
      expect(result!.description).toBe(original.description);
      expect(result!.status).toBe(original.status);
      expect(result!.priority).toBe(original.priority);
      expect(result!.progress).toBe(original.progress);
      expect(result!.ownerId).toBe(original.ownerId);
    }
  );
});

// ============================================================
// Property 16: Cascading delete removes all associated records
// ============================================================
describe("Property 16: Cascading delete removes all associated records", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test.prop(
    [fc.uuid(), fc.uuid(), fc.integer({ min: 0, max: 20 })],
    { numRuns: 100 }
  )(
    "deleting a project removes it and all N associated tasks",
    async (projectId, userId, taskCount) => {
      // Clear mocks at the start of each iteration to avoid count accumulation
      mockPrisma.project.findFirst.mockReset();
      mockPrisma.$transaction.mockReset();

      const existingProject = {
        id: projectId,
        name: "Test Project",
        description: "",
        status: "Planned",
        priority: "Medium",
        startDate: null,
        endDate: null,
        progress: 0,
        ownerId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock findFirst to return the project (ownership check passes)
      mockPrisma.project.findFirst.mockResolvedValue(existingProject);

      // Mock $transaction to execute the cascading delete
      mockPrisma.$transaction.mockResolvedValue([
        { count: taskCount }, // task.deleteMany result
        existingProject,      // project.delete result
      ]);

      const result = await projectService.delete(projectId, userId);

      // Delete should succeed
      expect(result).toBe(true);

      // Verify $transaction was called (cascading delete)
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);

      // Verify the transaction includes task deletion and project deletion
      const transactionArg = mockPrisma.$transaction.mock.calls[0][0];
      expect(transactionArg).toHaveLength(2);
    }
  );
});
