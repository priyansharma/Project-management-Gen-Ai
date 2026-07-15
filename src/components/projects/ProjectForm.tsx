"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import type { ProjectWithTasks, ProjectStatus, Priority } from "@/types";

/**
 * Client-side Zod schema for project update form.
 */
const updateProjectFormSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(255),
    description: z.string().max(5000),
    status: z.enum(["Planned", "Active", "Completed"]),
    priority: z.enum(["Low", "Medium", "High"]),
    startDate: z.string(),
    endDate: z.string(),
    progress: z.number().int().min(0).max(100),
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

type UpdateProjectFormData = z.infer<typeof updateProjectFormSchema>;

interface ProjectFormProps {
  project: ProjectWithTasks;
  onSubmit: (data: Record<string, unknown>) => void;
  isSubmitting?: boolean;
}

function formatDateForInput(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

/**
 * React Hook Form-based project edit form with Zod validation.
 * Pre-populates fields with existing project data.
 * Submits only changed fields to the API.
 */
export function ProjectForm({
  project,
  onSubmit,
  isSubmitting,
}: ProjectFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateProjectFormData>({
    resolver: zodResolver(updateProjectFormSchema),
    defaultValues: {
      name: project.name,
      description: project.description || "",
      status: project.status as ProjectStatus,
      priority: project.priority as Priority,
      startDate: formatDateForInput(project.startDate),
      endDate: formatDateForInput(project.endDate),
      progress: project.progress,
    },
  });

  // Reset form when project data changes (e.g., after a successful update)
  useEffect(() => {
    reset({
      name: project.name,
      description: project.description || "",
      status: project.status as ProjectStatus,
      priority: project.priority as Priority,
      startDate: formatDateForInput(project.startDate),
      endDate: formatDateForInput(project.endDate),
      progress: project.progress,
    });
  }, [project, reset]);

  const handleFormSubmit = (data: UpdateProjectFormData) => {
    // Convert date strings to ISO datetime or null for the API
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

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(handleFormSubmit)}
      sx={{ display: "flex", flexDirection: "column", gap: 2.5, mb: 4 }}
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

      <Box>
        <Typography gutterBottom>Progress: </Typography>
        <Controller
          name="progress"
          control={control}
          render={({ field }) => (
            <Slider
              {...field}
              onChange={(_, value) => field.onChange(value as number)}
              valueLabelDisplay="auto"
              min={0}
              max={100}
              marks={[
                { value: 0, label: "0%" },
                { value: 50, label: "50%" },
                { value: 100, label: "100%" },
              ]}
            />
          )}
        />
      </Box>

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          sx={{ minWidth: 44, minHeight: 44 }}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : undefined}
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </Box>
    </Box>
  );
}
