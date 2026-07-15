"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { apiClient } from "@/lib/api-client";

interface ProjectOption {
  id: string;
  name: string;
}

const createTaskFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(1024).optional().default(""),
  status: z.enum(["Todo", "InProgress", "Done"]),
  priority: z.enum(["Low", "Medium", "High"]),
  dueDate: z.string().optional().default(""),
  projectId: z.string().min(1, "Project is required"),
});

type CreateTaskFormData = z.infer<typeof createTaskFormSchema>;

interface CreateTaskGlobalDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (projectId: string, data: Record<string, unknown>) => void;
  isSubmitting?: boolean;
}

/**
 * Dialog for creating a task from the global tasks page.
 * Includes a project selector since tasks must belong to a project.
 */
export function CreateTaskGlobalDialog({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: CreateTaskGlobalDialogProps) {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "Todo",
      priority: "Medium",
      dueDate: "",
      projectId: "",
    },
  });

  // Fetch projects when dialog opens
  useEffect(() => {
    if (open) {
      setLoadingProjects(true);
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      apiClient<{ success: boolean; data: ProjectOption[] }>(
        "/api/projects?pageSize=50",
        { method: "GET", headers },
      )
        .then((res) => {
          setProjects(res.data || []);
        })
        .catch(() => {
          setProjects([]);
        })
        .finally(() => {
          setLoadingProjects(false);
        });
    }
  }, [open]);

  const handleFormSubmit = (data: CreateTaskFormData) => {
    const payload: Record<string, unknown> = {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
    };
    onSubmit(data.projectId, payload);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="create-task-global-dialog-title"
    >
      <DialogTitle id="create-task-global-dialog-title">
        Create New Task
      </DialogTitle>
      <DialogContent>
        {projects.length === 0 && !loadingProjects && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No projects found. Create a project first before adding tasks.
          </Alert>
        )}
        <Box
          component="form"
          id="create-task-global-form"
          onSubmit={handleSubmit(handleFormSubmit)}
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
        >
          <Controller
            name="projectId"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Project"
                select
                error={!!errors.projectId}
                helperText={errors.projectId?.message}
                fullWidth
                required
                disabled={loadingProjects || projects.length === 0}
              >
                {loadingProjects ? (
                  <MenuItem value="" disabled>
                    Loading projects...
                  </MenuItem>
                ) : (
                  projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  ))
                )}
              </TextField>
            )}
          />

          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Title"
                error={!!errors.title}
                helperText={errors.title?.message}
                fullWidth
                required
              />
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Description"
                multiline
                rows={3}
                error={!!errors.description}
                helperText={errors.description?.message}
                fullWidth
              />
            )}
          />

          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Status"
                  select
                  error={!!errors.status}
                  helperText={errors.status?.message}
                  fullWidth
                >
                  <MenuItem value="Todo">Todo</MenuItem>
                  <MenuItem value="InProgress">In Progress</MenuItem>
                  <MenuItem value="Done">Done</MenuItem>
                </TextField>
              )}
            />

            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Priority"
                  select
                  error={!!errors.priority}
                  helperText={errors.priority?.message}
                  fullWidth
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                </TextField>
              )}
            />
          </Box>

          <Controller
            name="dueDate"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Due Date"
                type="date"
                error={!!errors.dueDate}
                helperText={errors.dueDate?.message}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          disabled={isSubmitting}
          sx={{ minWidth: 44, minHeight: 44 }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="create-task-global-form"
          variant="contained"
          disabled={isSubmitting || projects.length === 0}
          sx={{ minWidth: 44, minHeight: 44 }}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : undefined}
        >
          {isSubmitting ? "Creating..." : "Create Task"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
