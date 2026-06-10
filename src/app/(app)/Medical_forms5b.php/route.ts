import { NextRequest, NextResponse } from "next/server";

import { resolveLegacyBranchId } from "@/lib/legacy-branch";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const brid = request.nextUrl.searchParams.get("brid")?.trim();

  if (!brid) {
    return NextResponse.redirect(new URL("/medical/accidents", request.url));
  }

  const branchId = await resolveLegacyBranchId(brid);
  if (!branchId) {
    return new NextResponse("Branch not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const target = new URL("/medical/accidents", request.url);
  target.searchParams.set("branch", branchId);
  return NextResponse.redirect(target);
}

export async function POST(request: NextRequest) {
  return GET(request);
}
