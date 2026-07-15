import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { taskService } from "@/services/task.service";
import { updateTaskSchema } from "@/validators/task.schema";
import { handleApiError } from "@/lib/error-handler";

/**
 * GET /api/tasks/[id]
 * Returns a single task by ID.
 * Only returns tasks belonging to projects owned by the authenticated user.
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

    // Fetch task via service layer
    const task = await taskService.findById(id, user.id);

    if (!task) {
      return NextResponse.json(
        {
          success: false as const,
          message: "The requested resource was not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true as const,
        data: task,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/tasks/[id]
 * Partially updates a task by ID.
 * Only updates tasks belonging to projects owned by the authenticated user.
 * Requires a valid Bearer token in the Authorization header.
 */
export async function PUT(
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

    // Parse request body
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

    // Validate input against Zod schema
    const data = updateTaskSchema.parse(body);

    // Update task via service layer
    const updatedTask = await taskService.update(id, data, user.id);

    if (!updatedTask) {
      return NextResponse.json(
        {
          success: false as const,
          message: "The requested resource was not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true as const,
        data: updatedTask,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/tasks/[id]
 * Deletes a task by ID.
 * Only deletes tasks belonging to projects owned by the authenticated user.
 * Requires a valid Bearer token in the Authorization header.
 */
export async function DELETE(
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

    // Delete task via service layer
    const deleted = await taskService.delete(id, user.id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false as const,
          message: "The requested resource was not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true as const,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
