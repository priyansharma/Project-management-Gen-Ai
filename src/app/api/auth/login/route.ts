import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/validators/auth.schema";
import { authService } from "@/services/auth.service";
import { handleApiError } from "@/lib/error-handler";

/**
 * POST /api/auth/login
 * Authenticate a user with email and password.
 * Returns 200 with token (24h expiry) and user info on success.
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
    const data = loginSchema.parse(body);

    // Authenticate via auth service (throws AppError 401 on invalid credentials)
    const result = await authService.login(data);

    return NextResponse.json(
      {
        success: true as const,
        data: {
          token: result.token,
          expiresIn: 24 * 60 * 60, // 24 hours in seconds
          user: result.user,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
