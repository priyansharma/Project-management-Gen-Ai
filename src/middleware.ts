import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Protected page path prefixes that require authentication.
 * Any page route starting with one of these needs a valid session.
 */
const protectedPagePrefixes = ["/dashboard", "/projects", "/tasks"];

/**
 * Check if the request path requires authentication.
 * - Protected page paths (dashboard, projects, tasks) require auth.
 * - API routes (except /api/auth/*) require auth.
 * - All other paths (login, register, unknown routes for 404) are public.
 */
function isProtectedPath(pathname: string): boolean {
  // Protected API routes (everything under /api/ except /api/auth/*)
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")) {
    return true;
  }

  // Protected page routes
  for (const prefix of protectedPagePrefixes) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return true;
    }
  }

  return false;
}

/**
 * Middleware that protects routes by checking for a valid JWT token.
 * - Unauthenticated API requests receive a 401 JSON response.
 * - Unauthenticated page requests are redirected to /login with a callbackUrl.
 * - Public paths (/login, /register, /api/auth/*, static assets) are allowed through.
 * - Unknown paths are allowed through so the 404 page renders without auth.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect known protected paths; let everything else through
  // (including unknown routes so the 404 page is accessible without auth)
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  // Check for valid JWT token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // If authenticated, allow the request through
  if (token) {
    return NextResponse.next();
  }

  // Unauthenticated: handle API routes vs page routes differently
  if (pathname.startsWith("/api/")) {
    // Return 401 JSON response for API requests
    return NextResponse.json(
      { success: false, message: "Please log in to continue" },
      { status: 401 },
    );
  }

  // Redirect unauthenticated page requests to login with callbackUrl
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(loginUrl);
}

/**
 * Matcher config to exclude Next.js internal routes and static assets.
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
