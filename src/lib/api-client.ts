/**
 * API client with 10-second timeout, error normalization, and JSON parsing.
 * Used by TanStack Query hooks to communicate with Next.js API route handlers.
 */

export class ApiError extends Error {
  public status: number;
  public errors?: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    status: number,
    errors?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export async function apiClient<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const body = await response.json();
      throw new ApiError(body.message, response.status, body.errors);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Server is unreachable. Please try again.", 0);
    }
    throw error;
  }
}
