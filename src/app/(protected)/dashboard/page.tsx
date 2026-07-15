"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useDashboard } from "@/hooks/useDashboard";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { RecentProjectsTable } from "@/components/dashboard/RecentProjectsTable";
import { RecentTasksList } from "@/components/dashboard/RecentTasksList";

/**
 * Dashboard page displaying stats, recent projects, and recent tasks.
 * Uses TanStack Query for data fetching with skeleton loaders during loading state.
 */
export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>
        Dashboard
      </Typography>

      {/* Stats Grid */}
      <Box sx={{ mb: 4 }}>
        <StatsGrid stats={data?.stats} isLoading={isLoading} />
      </Box>

      {/* Recent Projects and Tasks */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3,
        }}
      >
        <RecentProjectsTable
          projects={data?.recentProjects}
          isLoading={isLoading}
        />
        <RecentTasksList tasks={data?.recentTasks} isLoading={isLoading} />
      </Box>
    </Box>
  );
}
