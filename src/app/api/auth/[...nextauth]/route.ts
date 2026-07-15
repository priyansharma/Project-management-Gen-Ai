import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * NextAuth catch-all route handler.
 * Provides /api/auth/session, /api/auth/signin, /api/auth/signout,
 * /api/auth/callback/*, and CSRF endpoints that next-auth/react's
 * SessionProvider, useSession, signIn, and signOut rely on.
 *
 * Without this route, SessionProvider's background polling of
 * /api/auth/session receives Next.js's HTML 404 page instead of JSON,
 * causing "Unexpected token '<'" errors, and the JWT session cookie
 * that middleware.ts checks via getToken() is never established.
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
