"use client";

import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { Task } from "@/types";

interface RecentTasksListProps {
  tasks: Task[] | undefined;
  isLoading: boolean;
}

function getStatusColor(
  status: string,
): "default" | "primary" | "success" | "warning" {
  switch (status) {
    case "InProgress":
      return "primary";
    case "Done":
      return "success";
    case "Todo":
      return "warning";
    default:
      return "default";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "InProgress":
      return "In Progress";
    default:
      return status;
  }
}

function getPriorityColor(
  priority: string,
): "default" | "error" | "warning" | "info" {
  switch (priority) {
    case "High":
      return "error";
    case "Medium":
      return "warning";
    case "Low":
      return "info";
    default:
      return "default";
  }
}

function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * List showing the 5 most recently updated tasks.
 * Shows skeleton items when loading and empty state when no tasks exist.
 */
export function RecentTasksList({ tasks, isLoading }: RecentTasksListProps) {
  if (isLoading) {
    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Recent Tasks
        </Typography>
        <Paper variant="outlined">
          <List disablePadding>
            {Array.from({ length: 5 }).map((_, index) => (
              <ListItem key={index} divider={index < 4}>
                <ListItemText
                  primary={<Skeleton variant="text" width={180} />}
                  secondary={<Skeleton variant="text" width={100} />}
                />
                <Stack direction="row" spacing={1}>
                  <Skeleton variant="rounded" width={70} height={24} />
                  <Skeleton variant="rounded" width={55} height={24} />
                </Stack>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Recent Tasks
        </Typography>
        <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            No tasks yet. Add tasks to your projects to track progress.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Recent Tasks
      </Typography>
      <Paper variant="outlined">
        <List disablePadding>
          {tasks.map((task, index) => (
            <ListItem
              key={task.id}
              divider={index < tasks.length - 1}
              sx={{ py: 1.5 }}
            >
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {task.title}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    Updated {formatDate(task.updatedAt)}
                  </Typography>
                }
              />
              <Stack direction="row" spacing={1} sx={{ ml: 1, flexShrink: 0 }}>
                <Chip
                  label={getStatusLabel(task.status)}
                  color={getStatusColor(task.status)}
                  size="small"
                />
                <Chip
                  label={task.priority}
                  color={getPriorityColor(task.priority)}
                  size="small"
                  variant="outlined"
                />
              </Stack>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
