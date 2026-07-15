"use client";

import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Box from "@mui/material/Box";
import DeleteIcon from "@mui/icons-material/Delete";
import type { Task, TaskStatus, Priority } from "@/types";

interface TaskCardGridProps {
  tasks: Task[];
  loading?: boolean;
  onDelete: (taskId: string) => void;
}

const statusColorMap: Record<TaskStatus, "default" | "warning" | "success"> = {
  Todo: "default",
  InProgress: "warning",
  Done: "success",
};

const statusLabelMap: Record<TaskStatus, string> = {
  Todo: "Todo",
  InProgress: "In Progress",
  Done: "Done",
};

const priorityColorMap: Record<
  Priority,
  "default" | "info" | "warning" | "error"
> = {
  Low: "info",
  Medium: "warning",
  High: "error",
};

function formatDate(date: Date | string | null): string {
  if (!date) return "No due date";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Skeleton placeholder cards shown during loading state.
 */
function SkeletonCards() {
  return (
    <Grid container spacing={2}>
      {Array.from({ length: 6 }).map((_, index) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Skeleton variant="text" width="70%" height={28} />
              <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
                <Skeleton variant="rounded" width={80} height={24} />
                <Skeleton variant="rounded" width={60} height={24} />
              </Box>
              <Skeleton
                variant="text"
                width="50%"
                height={20}
                sx={{ mt: 1.5 }}
              />
            </CardContent>
            <CardActions>
              <Skeleton variant="circular" width={44} height={44} />
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

/**
 * Card-based layout for displaying tasks with status, priority, due date, and delete action.
 * Responsive: 1 column on mobile, 2 on tablet, 3 on desktop.
 */
export function TaskCardGrid({ tasks, loading, onDelete }: TaskCardGridProps) {
  if (loading) {
    return <SkeletonCards />;
  }

  if (tasks.length === 0) {
    return (
      <Box
        sx={{
          textAlign: "center",
          py: 6,
          color: "text.secondary",
        }}
      >
        <Typography variant="h6">No tasks found</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Try adjusting your search or filters.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {tasks.map((task) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={task.id}>
          <Card
            variant="outlined"
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <CardContent>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {task.title}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
                <Chip
                  label={statusLabelMap[task.status]}
                  color={statusColorMap[task.status]}
                  size="small"
                />
                <Chip
                  label={task.priority}
                  color={priorityColorMap[task.priority]}
                  size="small"
                  variant="outlined"
                />
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1.5 }}
              >
                {formatDate(task.dueDate)}
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: "flex-end" }}>
              <IconButton
                aria-label={`Delete task ${task.title}`}
                onClick={() => onDelete(task.id)}
                color="error"
                sx={{ minWidth: 44, minHeight: 44 }}
              >
                <DeleteIcon />
              </IconButton>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
