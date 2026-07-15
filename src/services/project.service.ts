import { prisma } from "@/lib/prisma";
import type { Project, ProjectWithTasks, PaginatedResponse } from "@/types";
import type { CreateProjectInput, UpdateProjectInput, ProjectListParams } from "@/validators/project.schema";

/**
 * Project service implementing CRUD operations with ownership isolation.
 * All methods require a userId parameter to enforce data ownership.
 * Non-owned resources return null/false (appear as 404 to the caller).
 */
export const projectService = {
  /**
   * Create a new project for the given user.
   * Sets ownerId to the authenticated user's ID.
   */
  async create(data: CreateProjectInput, userId: string): Promise<Project> {
    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description ?? "",
        status: data.status ?? "Planned",
        priority: data.priority,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        progress: data.progress ?? 0,
        ownerId: userId,
      },
    });

    return project as unknown as Project;
  },

  /**
   * Find a project by ID with its associated tasks.
   * Returns null if the project doesn't exist or is not owned by the user.
   */
  async findById(id: string, userId: string): Promise<ProjectWithTasks | null> {
    const project = await prisma.project.findFirst({
      where: {
        id,
        ownerId: userId,
      },
      include: {
        tasks: true,
      },
    });

    if (!project) {
      return null;
    }

    return project as unknown as ProjectWithTasks;
  },

  /**
   * Find all projects for a user with pagination, search, and status filter.
   * - page: defaults to 1
   * - pageSize: defaults to 10, max 50
   * - search: case-insensitive name contains
   * - status: exact match filter
   * - Sorted by createdAt descending
   */
  async findAll(
    params: ProjectListParams,
    userId: string
  ): Promise<PaginatedResponse<Project>> {
    const page = params.page ?? 1;
    const pageSize = Math.min(params.pageSize ?? 10, 50);
    const skip = (page - 1) * pageSize;

    // Build where clause with ownership + optional filters
    const where: Record<string, unknown> = {
      ownerId: userId,
    };

    if (params.search) {
      where.name = {
        contains: params.search,
        mode: "insensitive",
      };
    }

    if (params.status) {
      where.status = params.status;
    }

    // Execute count and data queries in parallel
    const [total, projects] = await Promise.all([
      prisma.project.count({ where: where as any }),
      prisma.project.findMany({
        where: where as any,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      success: true,
      data: projects as unknown as Project[],
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
      },
    };
  },

  /**
   * Update a project by ID.
   * Only updates provided fields (partial update).
   * Returns null if the project doesn't exist or is not owned by the user.
   */
  async update(
    id: string,
    data: UpdateProjectInput,
    userId: string
  ): Promise<Project | null> {
    // First check ownership
    const existing = await prisma.project.findFirst({
      where: {
        id,
        ownerId: userId,
      },
    });

    if (!existing) {
      return null;
    }

    // Build update data, only including provided fields
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.priority !== undefined) {
      updateData.priority = data.priority;
    }
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    }
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    }
    if (data.progress !== undefined) {
      updateData.progress = data.progress;
    }

    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    return updated as unknown as Project;
  },

  /**
   * Delete a project and all its associated tasks in a single transaction.
   * Returns false if the project doesn't exist or is not owned by the user.
   */
  async delete(id: string, userId: string): Promise<boolean> {
    // First check ownership
    const existing = await prisma.project.findFirst({
      where: {
        id,
        ownerId: userId,
      },
    });

    if (!existing) {
      return false;
    }

    // Cascading delete: tasks first, then project, in a single transaction
    await prisma.$transaction([
      prisma.task.deleteMany({
        where: { projectId: id },
      }),
      prisma.project.delete({
        where: { id },
      }),
    ]);

    return true;
  },
};
