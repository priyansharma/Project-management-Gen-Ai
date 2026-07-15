import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import type { ApiErrorResponse } from "@/types";

/**
 * Custom application error class for known business logic errors.
 */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

/**
 * Centralized API error handler.
 * Handles ZodError, AppError, PrismaClientKnownRequestError, and unknown errors.
 * Returns a consistent JSON error response.
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  // Zod validation errors → 400 with field-level details
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false as const,
        message: "Validation failed",
        errors: error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      },
      { status: 400 }
    );
  }

  // Known application errors (custom AppError class)
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false as const,
        message: error.message,
      },
      { status: error.statusCode }
    );
  }

  // Prisma known errors (e.g., unique constraint violation)
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false as const,
          message: "A record with this value already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false as const,
        message: "A database error occurred",
      },
      { status: 400 }
    );
  }

  // Unknown/unexpected errors → 500 with generic message
  console.error("Unexpected error:", error);
  return NextResponse.json(
    {
      success: false as const,
      message: "An unexpected error occurred",
    },
    { status: 500 }
  );
}
