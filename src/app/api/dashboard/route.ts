import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { dashboardService } from "@/services/dashboard.service";
import { handleApiError } from "@/lib/error-handler";

/**
 * GET /api/dashboard
 * Returns dashboard stats and recent items for the authenticated user.
 * Requires a valid Bearer token in the Authorization header.
 */
export async function GET(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get("authorization");
    let token: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    }

    if (!token) {
      return NextResponse.json(
        {
          success: false as const,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    // Validate session and get user info
    const user = await authService.validateSession(token);

    if (!user) {
      return NextResponse.json(
        {
          success: false as const,
          message: "Invalid or expired session",
        },
        { status: 401 }
      );
    }

    // Fetch dashboard data scoped to the authenticated user
    const [stats, recentProjects, recentTasks] = await Promise.all([
      dashboardService.getStats(user.id),
      dashboardService.getRecentProjects(user.id, 5),
      dashboardService.getRecentTasks(user.id, 5),
    ]);

    return NextResponse.json(
      {
        success: true as const,
        data: {
          stats,
          recentProjects,
          recentTasks,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
