import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { projectService } from "@/services/project.service";
import { handleApiError } from "@/lib/error-handler";
import { updateProjectSchema } from "@/validators/project.schema";

/**
 * GET /api/projects/[id]
 * Get a project by ID with associated tasks.
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

    // Fetch project with tasks
    const project = await projectService.findById(id, user.id);

    if (!project) {
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
        data: project,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/projects/[id]
 * Partial update of a project by ID.
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

    const data = updateProjectSchema.parse(body);

    // Update project
    const project = await projectService.update(id, data, user.id);

    if (!project) {
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
        data: project,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete a project and all its associated tasks (cascade).
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

    // Delete project (cascades to tasks)
    const deleted = await projectService.delete(id, user.id);

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
