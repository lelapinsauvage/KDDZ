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
        token.picture = user.image;
        token.legacyLogin = user.legacyLogin;
        token.legacySessionMode = user.legacySessionMode;
        token.legacySessionExpiresAt = user.legacySessionExpiresAt;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as typeof session.user.role;
        session.user.branchId = token.branchId as string | null;
        session.user.organizationId = token.organizationId as string | null;
        session.user.image = token.picture as string | null;
        session.user.legacyLogin = token.legacyLogin as
          | typeof session.user.legacyLogin
          | null;
        session.user.legacySessionMode =
          (token.legacySessionMode as typeof session.user.legacySessionMode) ??
          null;
        session.user.legacySessionExpiresAt =
          (token.legacySessionExpiresAt as string | null | undefined) ?? null;
      }
      return session;
    },
    async authorized({ auth, request }) {
      const legacySessionExpiresAt = auth?.user?.legacySessionExpiresAt;
      const legacySessionExpired =
        Boolean(legacySessionExpiresAt) &&
        Date.parse(legacySessionExpiresAt as string) <= Date.now();
      const isLoggedIn = !!auth?.user && !legacySessionExpired;
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
        pathname === "/users/protected.php" ||
        pathname === "/users/whoami.php" ||
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
