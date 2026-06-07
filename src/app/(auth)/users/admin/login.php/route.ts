import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const target = new URL("/login", request.url);
  target.searchParams.set("e", "1");
  return NextResponse.redirect(target);
}
