import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

// Next.js 16 requires a named `middleware` export or default export
export default auth((request) => {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-current-pathname", request.nextUrl.pathname);

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
