import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { taskService } from "@/services/task.service";
import { handleApiError } from "@/lib/error-handler";
import { createTaskSchema } from "@/validators/task.schema";

/**
 * GET /api/projects/[id]/tasks
 * List all tasks for a specific project.
 * Requires a valid Bearer token in the Authorization header.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Fetch tasks for the project
    const tasks = await taskService.findByProject(id, user.id);

    return NextResponse.json(
      {
        success: true as const,
        data: tasks,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/projects/[id]/tasks
 * Create a new task within a specific project.
 * Requires a valid Bearer token in the Authorization header.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Parse and validate request body
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        {
          success: false as const,
          message: "Request body is missing or malformed",
        },
        { status: 400 }
      );
    }

    // Override projectId with the URL parameter
    const data = createTaskSchema.parse({ ...body, projectId: id });

    // Create task (taskService.create handles ownership check on the project)
    const task = await taskService.create(data, user.id);

    return NextResponse.json(
      {
        success: true as const,
        data: task,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
