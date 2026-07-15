"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Task, PaginatedResponse, TaskStatus, Priority } from "@/types";

export interface UseTasksParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: TaskStatus | "";
  priority?: Priority | "";
}

/**
 * TanStack Query hook for fetching paginated task list with search and filters.
 * Reads auth token from localStorage and passes it as Authorization header.
 */
export function useTasks(params: UseTasksParams) {
  const { page, pageSize, search, status, priority } = params;

  return useQuery<PaginatedResponse<Task>>({
    queryKey: ["tasks", { page, pageSize, search, status, priority }],
    queryFn: async () => {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const searchParams = new URLSearchParams();
      searchParams.set("page", String(page));
      searchParams.set("pageSize", String(pageSize));
      if (search) {
        searchParams.set("search", search);
      }
      if (status) {
        searchParams.set("status", status);
      }
      if (priority) {
        searchParams.set("priority", priority);
      }

      const response = await apiClient<PaginatedResponse<Task>>(
        `/api/tasks?${searchParams.toString()}`,
        {
          method: "GET",
          headers,
        },
      );
      return response;
    },
  });
}
