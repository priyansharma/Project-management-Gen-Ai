"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { DashboardStats, Project, Task } from "@/types";

export interface DashboardData {
  stats: DashboardStats;
  recentProjects: Project[];
  recentTasks: Task[];
}

interface DashboardResponse {
  success: true;
  data: DashboardData;
}

/**
 * TanStack Query hook for fetching dashboard data.
 * Reads auth token from localStorage and passes it as Authorization header.
 */
export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await apiClient<DashboardResponse>("/api/dashboard", {
        method: "GET",
        headers,
      });
      return response.data;
    },
  });
}
