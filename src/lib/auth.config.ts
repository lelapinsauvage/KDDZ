import type { NextAuthConfig } from "next-auth";
import { isExpiredIsoDate, isPublicAuthPath } from "./auth-public-paths";

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
        token.id = user.id as string;
        token.role = user.role;
        token.branchId = user.branchId;
        token.organizationId = user.organizationId ?? null;
        token.picture = user.image;
        token.legacyLogin = user.legacyLogin;
        token.legacyAccess = user.legacyAccess;
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
        session.user.legacyAccess = token.legacyAccess as
          | typeof session.user.legacyAccess
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
      const legacySessionExpired = isExpiredIsoDate(legacySessionExpiresAt);
      const isLoggedIn = !!auth?.user && !legacySessionExpired;
      const { pathname } = request.nextUrl;
      const isPublic = isPublicAuthPath(pathname);

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
