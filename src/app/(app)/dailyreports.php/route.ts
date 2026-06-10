import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function redirectToDailyReports(request: NextRequest) {
  return NextResponse.redirect(new URL("/daily-reports", request.url));
}

export async function GET(request: NextRequest) {
  return redirectToDailyReports(request);
}

export async function POST(request: NextRequest) {
  return redirectToDailyReports(request);
}
