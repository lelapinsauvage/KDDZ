import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { isExpiredIsoDate, isPublicAuthPath } from "@/lib/auth-public-paths";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

// Next.js 16 requires a named `middleware` export or default export
export default auth((request) => {
  const { pathname, search } = request.nextUrl;
  const legacySessionExpired = isExpiredIsoDate(
    request.auth?.user?.legacySessionExpiresAt,
  );
  const isLoggedIn = Boolean(request.auth?.user) && !legacySessionExpired;

  if (isLoggedIn && pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  if (!isPublicAuthPath(pathname) && !isLoggedIn) {
    const target = new URL("/login", request.nextUrl);
    target.searchParams.set(
      "callbackUrl",
      `${pathname}${search}` || "/dashboard",
    );
    return NextResponse.redirect(target);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-current-pathname", pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*\\.js|.*\\.svg).*)",
  ],
};
