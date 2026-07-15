import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { handleApiError } from "@/lib/error-handler";

/**
 * POST /api/auth/logout
 * Invalidate the current session.
 * Extracts token from Authorization header (Bearer <token>).
 * Returns 200 on success. Idempotent — multiple calls return 200.
 */
export async function POST(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get("authorization");
    let token: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    }

    // If no token found, return 401
    if (!token) {
      return NextResponse.json(
        {
          success: false as const,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    // Validate that the token is a real session (not already invalid/expired)
    // But for idempotency, if token was already invalidated, still return 200
    const isAlreadyInvalidated = authService.isTokenInvalidated(token);

    if (!isAlreadyInvalidated) {
      // Verify token is a valid session before invalidating
      const session = await authService.validateSession(token);

      if (!session) {
        return NextResponse.json(
          {
            success: false as const,
            message: "Invalid or expired session",
          },
          { status: 401 }
        );
      }
    }

    // Invalidate the token (idempotent operation)
    await authService.logout(token);

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
