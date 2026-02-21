import type { NextAuthConfig } from "next-auth";

/**
 * Auth config WITHOUT database dependencies.
 * Used by middleware (runs at edge — can't import Prisma).
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.branchId = (user as any).branchId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).branchId = token.branchId;
      }
      return session;
    },
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      // Public routes
      const isPublic =
        pathname.startsWith("/login") ||
        pathname.startsWith("/forgot") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/parent");

      if (isPublic) {
        // Redirect logged-in users away from login page
        if (isLoggedIn && pathname.startsWith("/login")) {
          return Response.redirect(new URL("/dashboard", request.nextUrl));
        }
        return true;
      }

      // Protected routes — must be logged in
      return isLoggedIn;
    },
  },
  providers: [], // Providers added in auth.ts (not needed for middleware)
} satisfies NextAuthConfig;
