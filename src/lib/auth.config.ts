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
        token.role = user.role;
        token.branchId = user.branchId;
        token.organizationId = user.organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as typeof session.user.role;
        session.user.branchId = token.branchId as string | null;
        session.user.organizationId = token.organizationId as string | null;
      }
      return session;
    },
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const isParentPortal =
        pathname === "/parent" || pathname.startsWith("/parent/");

      // Public routes
      const isPublic =
        pathname.startsWith("/login") ||
        pathname.startsWith("/forgot") ||
        pathname === "/forgot.php" ||
        pathname === "/users/forgot.php" ||
        pathname === "/signup" ||
        pathname === "/sign_up.php" ||
        pathname === "/users/sign_up.php" ||
        pathname === "/users/admin/login.php" ||
        pathname === "/logout.php" ||
        pathname === "/users/logout.php" ||
        pathname === "/disabled.php" ||
        pathname === "/users/disabled.php" ||
        pathname === "/profile.php" ||
        pathname === "/users/profile.php" ||
        pathname === "/activate.php" ||
        pathname === "/users/activate.php" ||
        isParentPortal ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/cron") ||
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
