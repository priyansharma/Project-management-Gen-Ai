import { prisma } from "@/lib/prisma";
import type { DashboardStats, Project, Task } from "@/types";

/**
 * Dashboard service providing aggregated stats and recent items.
 * All queries are scoped to the authenticated user's data.
 */
export const dashboardService = {
  /**
   * Get dashboard statistics for a user.
   * Returns counts for total/active/completed projects and total/pending/completed tasks.
   * - activeProjects: count where status = Active
   * - completedProjects: count where status = Completed
   * - pendingTasks: count where status in (Todo, InProgress)
   * - completedTasks: count where status = Done
   */
  async getStats(userId: string): Promise<DashboardStats> {
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      pendingTasks,
      completedTasks,
    ] = await Promise.all([
      prisma.project.count({
        where: { ownerId: userId },
      }),
      prisma.project.count({
        where: { ownerId: userId, status: "Active" },
      }),
      prisma.project.count({
        where: { ownerId: userId, status: "Completed" },
      }),
      prisma.task.count({
        where: { project: { ownerId: userId } },
      }),
      prisma.task.count({
        where: {
          project: { ownerId: userId },
          status: { in: ["Todo", "InProgress"] },
        },
      }),
      prisma.task.count({
        where: {
          project: { ownerId: userId },
          status: "Done",
        },
      }),
    ]);

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      pendingTasks,
      completedTasks,
    };
  },

  /**
   * Get the most recently updated projects for a user.
   * Returns up to `limit` projects ordered by updatedAt descending.
   */
  async getRecentProjects(userId: string, limit: number = 5): Promise<Project[]> {
    const projects = await prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });

    return projects as unknown as Project[];
  },

  /**
   * Get the most recently updated tasks from the user's projects.
   * Returns up to `limit` tasks ordered by updatedAt descending.
   */
  async getRecentTasks(userId: string, limit: number = 5): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: { project: { ownerId: userId } },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });

    return tasks as unknown as Task[];
  },
};
