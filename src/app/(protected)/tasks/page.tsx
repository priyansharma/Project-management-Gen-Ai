"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputAdornment from "@mui/material/InputAdornment";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import { useTasks } from "@/hooks/useTasks";
import { TaskCardGrid } from "@/components/tasks/TaskCardGrid";
import { CreateTaskGlobalDialog } from "@/components/tasks/CreateTaskGlobalDialog";
import { Pagination } from "@/components/ui/Pagination";
import { apiClient } from "@/lib/api-client";
import type { TaskStatus, Priority } from "@/types";

/**
 * Global task list page with search, status/priority filters, card grid, and pagination.
 * Supports task deletion with confirmation dialog.
 */
export default function TasksPage() {
  // Filter and pagination state
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TaskStatus | "">("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  // Fetch tasks
  const { data, isLoading } = useTasks({
    page,
    pageSize,
    search,
    status,
    priority,
  });

  // Delete task mutation
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const createTaskMutation = useMutation({
    mutationFn: async ({
      projectId,
      data,
    }: {
      projectId: string;
      data: Record<string, unknown>;
    }) => {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      return apiClient(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setCreateDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      await apiClient(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    },
  });

  const handleDeleteClick = (taskId: string) => {
    setTaskToDelete(taskId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (taskToDelete) {
      deleteMutation.mutate(taskToDelete);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    setStatus(event.target.value as TaskStatus | "");
    setPage(1);
  };

  const handlePriorityChange = (event: SelectChangeEvent<string>) => {
    setPriority(event.target.value as Priority | "");
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const tasks = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 0;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Tasks
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ minWidth: 44, minHeight: 44 }}
        >
          Create Task
        </Button>
      </Box>

      {/* Search and Filters */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 3,
        }}
      >
        <TextField
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: 200 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              sx: { minHeight: 44 },
            },
          }}
          aria-label="Search tasks"
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="task-status-filter-label">Status</InputLabel>
          <Select
            labelId="task-status-filter-label"
            value={status}
            label="Status"
            onChange={handleStatusChange}
            sx={{ minHeight: 44 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Todo">Todo</MenuItem>
            <MenuItem value="InProgress">In Progress</MenuItem>
            <MenuItem value="Done">Done</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="task-priority-filter-label">Priority</InputLabel>
          <Select
            labelId="task-priority-filter-label"
            value={priority}
            label="Priority"
            onChange={handlePriorityChange}
            sx={{ minHeight: 44 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Low">Low</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="High">High</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Task Card Grid */}
      <TaskCardGrid
        tasks={tasks}
        loading={isLoading}
        onDelete={handleDeleteClick}
      />

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this task? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCancelDelete}
            sx={{ minHeight: 44, minWidth: 44 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
            sx={{ minHeight: 44, minWidth: 44 }}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Task Dialog */}
      <CreateTaskGlobalDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={(projectId, data) =>
          createTaskMutation.mutate({ projectId, data })
        }
        isSubmitting={createTaskMutation.isPending}
      />
    </Box>
  );
}
