import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function redirectToDraftDailyReports(request: NextRequest) {
  return NextResponse.redirect(new URL("/daily-reports/drafts", request.url));
}

export async function GET(request: NextRequest) {
  return redirectToDraftDailyReports(request);
}

export async function POST(request: NextRequest) {
  return redirectToDraftDailyReports(request);
}
