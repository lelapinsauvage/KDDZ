import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

// Next.js 16 requires a named `middleware` export or default export
export default async function middleware(request: NextRequest) {
  // @ts-expect-error — auth() wraps the request handler
  return auth(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
