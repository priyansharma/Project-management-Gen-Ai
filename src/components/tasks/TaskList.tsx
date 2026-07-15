"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import type { Task, TaskStatus, Priority } from "@/types";

interface TaskListProps {
  tasks: Task[];
  loading?: boolean;
  onDeleteTask: (taskId: string) => void;
  onAddTask: () => void;
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
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton variant="text" width="80%" />
          </TableCell>
          <TableCell>
            <Skeleton variant="rounded" width={80} height={24} />
          </TableCell>
          <TableCell>
            <Skeleton variant="rounded" width={60} height={24} />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" width={100} />
          </TableCell>
          <TableCell>
            <Skeleton variant="circular" width={36} height={36} />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

/**
 * Table-based task list for displaying tasks within a project context.
 * Shows title, status, priority, due date, and delete action.
 * Includes an "Add Task" button to open the create task dialog.
 */
export function TaskList({
  tasks,
  loading,
  onDeleteTask,
  onAddTask,
}: TaskListProps) {
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Tasks ({loading ? "..." : tasks.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddTask}
          sx={{ minWidth: 44, minHeight: 44 }}
        >
          Add Task
        </Button>
      </Box>

      {!loading && tasks.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
          <Typography variant="body1">No tasks yet.</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Click &quot;Add Task&quot; to create the first task for this
            project.
          </Typography>
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ overflowX: "auto" }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <SkeletonRows />
              ) : (
                tasks.map((task) => (
                  <TableRow key={task.id} hover>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          maxWidth: 250,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {task.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={statusLabelMap[task.status]}
                        color={statusColorMap[task.status]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={task.priority}
                        color={priorityColorMap[task.priority]}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(task.dueDate)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        aria-label={`Delete task ${task.title}`}
                        onClick={() => onDeleteTask(task.id)}
                        color="error"
                        sx={{ minWidth: 44, minHeight: 44 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
