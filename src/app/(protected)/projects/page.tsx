"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import { SearchBar } from "@/components/projects/SearchBar";
import { ViewToggle, type ViewMode } from "@/components/projects/ViewToggle";
import { ProjectTable } from "@/components/projects/ProjectTable";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { Pagination } from "@/components/ui/Pagination";
import { useProjects } from "@/hooks/useProjects";
import { apiClient } from "@/lib/api-client";
import type { ProjectStatus } from "@/types";

/**
 * Project list page with search, status filter, table/grid view toggle, and pagination.
 * Uses TanStack Query for data fetching with debounced search input.
 */
export default function ProjectsPage() {
  const [view, setView] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Debounce search input by 300ms
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on new search
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  // Reset page when status filter changes
  useEffect(() => {
    setPage(1);
  }, [status]);

  const { data, isLoading } = useProjects({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    status: status || undefined,
  });

  const projects = data?.data;
  const pagination = data?.pagination;

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      return apiClient("/api/projects", {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setCreateDialogOpen(false);
    },
  });

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          mb: 3,
          gap: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          Projects
        </Typography>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ minWidth: 44, minHeight: 44 }}
          >
            Create Project
          </Button>
          <ViewToggle view={view} onViewChange={setView} />
        </Box>
      </Box>

      <SearchBar
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
      />

      {view === "table" ? (
        <ProjectTable projects={projects} isLoading={isLoading} />
      ) : (
        <ProjectGrid projects={projects} isLoading={isLoading} />
      )}

      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          pageSize={pagination.pageSize}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      <CreateProjectDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isSubmitting={createMutation.isPending}
      />
    </Box>
  );
}
