"use client";

import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import type { Project } from "@/types";

interface ProjectGridProps {
  projects: Project[] | undefined;
  isLoading: boolean;
}

function getStatusColor(
  status: string,
): "default" | "primary" | "success" | "warning" {
  switch (status) {
    case "Active":
      return "primary";
    case "Completed":
      return "success";
    case "Planned":
      return "warning";
    default:
      return "default";
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

/**
 * Grid/card view for the project list page.
 * Shows name, status chip, priority chip, and progress bar.
 * Responsive: 1 column on mobile, 2 on tablet, 3 on desktop.
 * Displays skeleton cards during loading.
 */
export function ProjectGrid({ projects, isLoading }: ProjectGridProps) {
  if (isLoading) {
    return (
      <Grid container spacing={2}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
            <Card variant="outlined">
              <CardContent>
                <Skeleton variant="text" width="60%" height={28} />
                <Box sx={{ display: "flex", gap: 1, mt: 1, mb: 2 }}>
                  <Skeleton variant="rounded" width={70} height={24} />
                  <Skeleton variant="rounded" width={60} height={24} />
                </Box>
                <Skeleton variant="rounded" width="100%" height={8} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          No projects found. Adjust your search or filters.
        </Typography>
      </Paper>
    );
  }

  return (
    <Grid container spacing={2}>
      {projects.map((project) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.id}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, mb: 1 }}
                noWrap
              >
                {project.name}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                <Chip
                  label={project.status}
                  color={getStatusColor(project.status)}
                  size="small"
                />
                <Chip
                  label={project.priority}
                  color={getPriorityColor(project.priority)}
                  size="small"
                  variant="outlined"
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={project.progress}
                  sx={{ flex: 1, height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {project.progress}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
