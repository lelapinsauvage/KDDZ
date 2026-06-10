import { handlers } from "@/lib/auth";
import { makeAuthSessionCookiesBrowserScoped } from "@/lib/legacy-session-cookies";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return makeAuthSessionCookiesBrowserScoped(await handlers.GET(request));
}

export async function POST(request: NextRequest) {
  return makeAuthSessionCookiesBrowserScoped(await handlers.POST(request));
}
