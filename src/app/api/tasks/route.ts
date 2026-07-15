import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { taskService } from "@/services/task.service";
import { taskListParamsSchema } from "@/validators/task.schema";
import { handleApiError } from "@/lib/error-handler";

/**
 * GET /api/tasks
 * Returns a paginated list of all tasks belonging to projects owned by the authenticated user.
 * Supports search (title contains), status filter, priority filter, and pagination.
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

    // Parse query parameters with Zod schema
    const { searchParams } = new URL(request.url);
    const rawParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      rawParams[key] = value;
    });

    const params = taskListParamsSchema.parse(rawParams);

    // Fetch tasks via service layer
    const result = await taskService.findAll(params, user.id);

    return NextResponse.json(
      {
        success: true as const,
        data: result.data,
        pagination: result.pagination,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
