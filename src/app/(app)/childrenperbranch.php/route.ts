import { NextRequest, NextResponse } from "next/server";

import { resolveLegacyBranchId } from "@/lib/legacy-branch";

export const runtime = "nodejs";

async function branchChildrenTarget(request: NextRequest) {
  const brid = request.nextUrl.searchParams.get("brid")?.trim();

  if (!brid) {
    return new URL("/children", request.url);
  }

  const branchId = await resolveLegacyBranchId(brid);
  if (!branchId) return null;

  return new URL(`/branches/${encodeURIComponent(branchId)}/children`, request.url);
}

export async function GET(request: NextRequest) {
  const target = await branchChildrenTarget(request);
  if (!target) {
    return new NextResponse("Branch not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return NextResponse.redirect(target);
}

export async function POST(request: NextRequest) {
  return GET(request);
}
