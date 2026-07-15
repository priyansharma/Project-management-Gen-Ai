import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { projectService } from "@/services/project.service";
import { handleApiError } from "@/lib/error-handler";
import {
  createProjectSchema,
  projectListParamsSchema,
} from "@/validators/project.schema";

/**
 * GET /api/projects
 * List projects with pagination, search, and status filter.
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const params = projectListParamsSchema.parse({
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });

    // Fetch projects with pagination/search/filter
    const result = await projectService.findAll(params, user.id);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/projects
 * Create a new project for the authenticated user.
 * Requires a valid Bearer token in the Authorization header.
 */
export async function POST(request: NextRequest) {
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

    const data = createProjectSchema.parse(body);

    // Create project
    const project = await projectService.create(data, user.id);

    return NextResponse.json(
      {
        success: true as const,
        data: project,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
