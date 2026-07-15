import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/error-handler";
import type { CreateTaskInput, UpdateTaskInput, TaskListParams } from "@/validators/task.schema";
import type { Task } from "@/types";

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

/**
 * Task service implementing CRUD operations with ownership checks through project ownership.
 * A task is accessible to a user only if its parent project is owned by that user.
 */
export const taskService = {
  /**
   * Create a new task.
   * Verifies the projectId exists and is owned by the user before creating.
   */
  async create(data: CreateTaskInput, userId: string): Promise<Task> {
    // Verify project exists and is owned by the user
    const project = await prisma.project.findFirst({
      where: {
        id: data.projectId,
        ownerId: userId,
      },
    });

    if (!project) {
      throw new AppError(404, "The requested resource was not found");
    }

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description ?? "",
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        projectId: data.projectId,
      },
    });

    return task as unknown as Task;
  },

  /**
   * Find a task by ID.
   * Returns null if the task doesn't exist or belongs to a project not owned by the user.
   */
  async findById(id: string, userId: string): Promise<Task | null> {
    const task = await prisma.task.findFirst({
      where: {
        id,
        project: {
          ownerId: userId,
        },
      },
    });

    return task as unknown as Task | null;
  },

  /**
   * Find all tasks belonging to projects owned by the user.
   * Supports pagination, search (case-insensitive title contains),
   * status filter, and priority filter with AND logic.
   */
  async findAll(params: TaskListParams, userId: string): Promise<PaginatedResult<Task>> {
    const { page, pageSize, search, status, priority } = params;

    // Build where clause: only tasks from user-owned projects
    const where: Record<string, unknown> = {
      project: {
        ownerId: userId,
      },
    };

    // Search: case-insensitive title contains
    if (search) {
      where.title = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Priority filter
    if (priority) {
      where.priority = priority;
    }

    // Get total count for pagination metadata
    const total = await prisma.task.count({ where: where as any });

    // Calculate pagination
    const totalPages = Math.ceil(total / pageSize);
    const skip = (page - 1) * pageSize;

    // Fetch tasks
    const tasks = await prisma.task.findMany({
      where: where as any,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    });

    return {
      data: tasks as unknown as Task[],
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
      },
    };
  },

  /**
   * Find all tasks for a specific project.
   * Returns empty array if the project doesn't exist or is not owned by the user.
   */
  async findByProject(projectId: string, userId: string): Promise<Task[]> {
    // Verify project exists and is owned by the user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId,
      },
    });

    if (!project) {
      return [];
    }

    const tasks = await prisma.task.findMany({
      where: {
        projectId,
      },
      orderBy: { createdAt: "desc" },
    });

    return tasks as unknown as Task[];
  },

  /**
   * Update a task.
   * Returns null if the task doesn't exist or belongs to a project not owned by the user.
   */
  async update(id: string, data: UpdateTaskInput, userId: string): Promise<Task | null> {
    // Verify task exists and belongs to a user-owned project
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        project: {
          ownerId: userId,
        },
      },
    });

    if (!existingTask) {
      return null;
    }

    // Build update data, only including provided fields
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
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
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    return updatedTask as unknown as Task;
  },

  /**
   * Delete a task.
   * Returns false if the task doesn't exist or belongs to a project not owned by the user.
   */
  async delete(id: string, userId: string): Promise<boolean> {
    // Verify task exists and belongs to a user-owned project
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        project: {
          ownerId: userId,
        },
      },
    });

    if (!existingTask) {
      return false;
    }

    await prisma.task.delete({
      where: { id },
    });

    return true;
  },
};
