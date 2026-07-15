"use client";

import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import type { DashboardStats } from "@/types";

interface StatCardProps {
  label: string;
  value: number;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h4" component="div" sx={{ fontWeight: "bold" }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card variant="outlined">
      <CardContent>
        <Skeleton variant="text" width={60} height={40} />
        <Skeleton variant="text" width={120} height={20} />
      </CardContent>
    </Card>
  );
}

interface StatsGridProps {
  stats: DashboardStats | undefined;
  isLoading: boolean;
}

/**
 * Dashboard stats grid showing 6 stat cards.
 * Responsive: single column below 768px, multi-column grid above.
 */
export function StatsGrid({ stats, isLoading }: StatsGridProps) {
  if (isLoading) {
    return (
      <Grid container spacing={2}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCardSkeleton />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (!stats) return null;

  const cards = [
    { label: "Total Projects", value: stats.totalProjects },
    { label: "Active Projects", value: stats.activeProjects },
    { label: "Completed Projects", value: stats.completedProjects },
    { label: "Total Tasks", value: stats.totalTasks },
    { label: "Pending Tasks", value: stats.pendingTasks },
    { label: "Completed Tasks", value: stats.completedTasks },
  ];

  return (
    <Grid container spacing={2}>
      {cards.map((card) => (
        <Grid key={card.label} size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard label={card.label} value={card.value} />
        </Grid>
      ))}
    </Grid>
  );
}
