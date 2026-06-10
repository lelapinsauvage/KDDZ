import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

function isExpiredIsoDate(value: string | null | undefined) {
  return Boolean(value) && Date.parse(value as string) <= Date.now();
}

function isPublicPath(pathname: string) {
  return (
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
    pathname === "/master.php" ||
    pathname === "/parent" ||
    pathname.startsWith("/parent/") ||
    pathname.startsWith("/ws/") ||
    pathname.includes("/ws/") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/parent")
  );
}

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

  if (!isPublicPath(pathname) && !isLoggedIn) {
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
