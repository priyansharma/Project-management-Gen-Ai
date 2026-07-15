"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { apiClient } from "@/lib/api-client";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { TaskList } from "@/components/tasks/TaskList";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import type { ProjectWithTasks, ApiSuccessResponse } from "@/types";

function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Project detail page: displays project info, edit form, and task list.
 * Fetches project (with tasks) via GET /api/projects/[id].
 * Supports editing, deleting, and task CRUD operations.
 */
export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = params.id;

  const [isEditing, setIsEditing] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);

  // Fetch project with tasks
  const {
    data: projectResponse,
    isLoading,
    error,
  } = useQuery<ApiSuccessResponse<ProjectWithTasks>>({
    queryKey: ["project", projectId],
    queryFn: async () => {
      return apiClient<ApiSuccessResponse<ProjectWithTasks>>(
        `/api/projects/${projectId}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        },
      );
    },
    enabled: !!projectId,
  });

  const project = projectResponse?.data;

  // Update project mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return apiClient<ApiSuccessResponse<ProjectWithTasks>>(
        `/api/projects/${projectId}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setIsEditing(false);
    },
  });

  // Delete project mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiClient<{ success: true }>(`/api/projects/${projectId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push("/projects");
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return apiClient<ApiSuccessResponse<unknown>>(
        `/api/projects/${projectId}/tasks`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setCreateTaskOpen(false);
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return apiClient<{ success: true }>(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  // Loading state with skeletons
  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={120} height={28} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={200} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={150} />
      </Box>
    );
  }

  // Error / 404 state
  if (error || !project) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/projects")}
          sx={{ mb: 2, minWidth: 44, minHeight: 44 }}
        >
          Back to Projects
        </Button>
        <Alert severity="error">
          {error?.message ||
            "Project not found. It may have been deleted or you don't have access."}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Back navigation */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push("/projects")}
        sx={{ mb: 2, minWidth: 44, minHeight: 44 }}
      >
        Back to Projects
      </Button>

      {/* Project Header with edit/delete actions */}
      <ProjectHeader
        name={project.name}
        status={project.status}
        isEditing={isEditing}
        onEditToggle={() => setIsEditing(!isEditing)}
        onDelete={() => deleteMutation.mutate()}
        deleteLoading={deleteMutation.isPending}
      />

      {/* Error alerts for mutations */}
      {updateMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {updateMutation.error?.message || "Failed to update project."}
        </Alert>
      )}
      {deleteMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {deleteMutation.error?.message || "Failed to delete project."}
        </Alert>
      )}

      {/* Project description when not editing */}
      {!isEditing && project.description && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {project.description}
        </Typography>
      )}

      {/* Edit form */}
      {isEditing && (
        <ProjectForm
          project={project}
          onSubmit={(data) => updateMutation.mutate(data)}
          isSubmitting={updateMutation.isPending}
        />
      )}

      {/* Project details summary when not editing */}
      {!isEditing && (
        <Box
          sx={{
            display: "flex",
            gap: 3,
            flexWrap: "wrap",
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              Priority
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {project.priority}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {project.progress}%
            </Typography>
          </Box>
          {project.startDate && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Start Date
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {new Date(project.startDate).toLocaleDateString()}
              </Typography>
            </Box>
          )}
          {project.endDate && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                End Date
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {new Date(project.endDate).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Task List */}
      <TaskList
        tasks={project.tasks || []}
        loading={false}
        onDeleteTask={(taskId) => deleteTaskMutation.mutate(taskId)}
        onAddTask={() => setCreateTaskOpen(true)}
      />

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        onSubmit={(data) => createTaskMutation.mutate(data)}
        isSubmitting={createTaskMutation.isPending}
      />
    </Box>
  );
}
