import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth";
import { legacyLogoutRedirectPath } from "@/lib/legacy-logout";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const redirectTo = await legacyLogoutRedirectPath(request);
  await signOut({ redirect: false, redirectTo });
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
