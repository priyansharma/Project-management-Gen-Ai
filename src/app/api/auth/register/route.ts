import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/validators/auth.schema";
import { authService } from "@/services/auth.service";
import { handleApiError } from "@/lib/error-handler";

/**
 * POST /api/auth/register
 * Register a new user account.
 * Returns 201 with user data on success.
 */
export async function POST(request: NextRequest) {
  try {
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

    // Validate input against Zod schema (throws ZodError on failure)
    const data = registerSchema.parse(body);

    // Create user via auth service (handles duplicate email check)
    const user = await authService.register(data);

    return NextResponse.json(
      {
        success: true as const,
        data: user,
        message: "User registered successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
