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

const createProjectFormSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(255),
    description: z.string().max(5000).optional().default(""),
    status: z.enum(["Planned", "Active", "Completed"]),
    priority: z.enum(["Low", "Medium", "High"]),
    startDate: z.string().optional().default(""),
    endDate: z.string().optional().default(""),
    progress: z.coerce.number().int().min(0).max(100).optional().default(0),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date must be equal to or later than start date",
      path: ["endDate"],
    },
  );

type CreateProjectFormData = z.infer<typeof createProjectFormSchema>;

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  isSubmitting?: boolean;
}

export function CreateProjectDialog({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: CreateProjectDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "Planned",
      priority: "Medium",
      startDate: "",
      endDate: "",
      progress: 0,
    },
  });

  const handleFormSubmit = (data: CreateProjectFormData) => {
    const payload: Record<string, unknown> = {
      name: data.name,
      description: data.description,
      status: data.status,
      priority: data.priority,
      progress: data.progress,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
      endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
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
      aria-labelledby="create-project-dialog-title"
    >
      <DialogTitle id="create-project-dialog-title">
        Create New Project
      </DialogTitle>
      <DialogContent>
        <Box
          component="form"
          id="create-project-form"
          onSubmit={handleSubmit(handleFormSubmit)}
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Project Name"
                error={!!errors.name}
                helperText={errors.name?.message}
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
                  <MenuItem value="Planned">Planned</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
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

          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Start Date"
                  type="date"
                  error={!!errors.startDate}
                  helperText={errors.startDate?.message}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            />

            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="End Date"
                  type="date"
                  error={!!errors.endDate}
                  helperText={errors.endDate?.message}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            />
          </Box>
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
          form="create-project-form"
          variant="contained"
          disabled={isSubmitting}
          sx={{ minWidth: 44, minHeight: 44 }}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : undefined}
        >
          {isSubmitting ? "Creating..." : "Create Project"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
