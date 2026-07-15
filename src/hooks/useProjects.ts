"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Project, PaginatedResponse, ProjectStatus } from "@/types";

export interface UseProjectsParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: ProjectStatus | "";
}

/**
 * TanStack Query hook for fetching paginated project list with search and filters.
 * Reads auth token from localStorage and passes it as Authorization header.
 */
export function useProjects(params: UseProjectsParams) {
  const { page, pageSize, search, status } = params;

  return useQuery<PaginatedResponse<Project>>({
    queryKey: ["projects", { page, pageSize, search, status }],
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

      const response = await apiClient<PaginatedResponse<Project>>(
        `/api/projects?${searchParams.toString()}`,
        {
          method: "GET",
          headers,
        },
      );
      return response;
    },
  });
}
