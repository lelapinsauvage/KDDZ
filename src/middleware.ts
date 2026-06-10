import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { isExpiredIsoDate, isPublicAuthPath } from "@/lib/auth-public-paths";

function responseWithCurrentPath(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-current-pathname", pathname);
  requestHeaders.set("x-current-path", `${pathname}${search}`);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export default async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });
  const legacySessionExpiresAt =
    typeof token?.legacySessionExpiresAt === "string"
      ? token.legacySessionExpiresAt
      : null;
  const legacySessionExpired = isExpiredIsoDate(legacySessionExpiresAt);
  const isLoggedIn = Boolean(token) && !legacySessionExpired;

  if (isLoggedIn && pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  if (!isPublicAuthPath(pathname) && !isLoggedIn) {
    if (!pathname.startsWith("/api/")) {
      return responseWithCurrentPath(request);
    }

    const target = new URL("/login", request.nextUrl);
    target.searchParams.set(
      "callbackUrl",
      `${pathname}${search}` || "/dashboard",
    );
    return NextResponse.redirect(target);
  }

  return responseWithCurrentPath(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*\\.js|.*\\.svg).*)",
  ],
};
