"use client";

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

/**
 * Client-side Zod schema for task creation (projectId is injected separately).
 */
const createTaskFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(1024),
  status: z.enum(["Todo", "InProgress", "Done"]),
  priority: z.enum(["Low", "Medium", "High"]),
  dueDate: z.string(),
});

type CreateTaskFormData = z.infer<typeof createTaskFormSchema>;

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  isSubmitting?: boolean;
}

/**
 * Material UI Dialog for creating a new task within a project.
 * Uses React Hook Form + Zod for client-side validation.
 * The projectId is not part of the form — it's injected by the parent when calling the API.
 */
export function CreateTaskDialog({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: CreateTaskDialogProps) {
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
    },
  });

  const handleFormSubmit = (data: CreateTaskFormData) => {
    const payload: Record<string, unknown> = {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
    };
    onSubmit(payload);
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
      aria-labelledby="create-task-dialog-title"
    >
      <DialogTitle id="create-task-dialog-title">Create New Task</DialogTitle>
      <DialogContent>
        <Box
          component="form"
          id="create-task-form"
          onSubmit={handleSubmit(handleFormSubmit)}
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
        >
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
                autoFocus
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
          form="create-task-form"
          variant="contained"
          disabled={isSubmitting}
          sx={{ minWidth: 44, minHeight: 44 }}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : undefined}
        >
          {isSubmitting ? "Creating..." : "Create Task"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
