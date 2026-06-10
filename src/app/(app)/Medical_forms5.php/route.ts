import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function redirectToAccidentReports(request: NextRequest) {
  return NextResponse.redirect(new URL("/medical/accidents", request.url));
}

export async function GET(request: NextRequest) {
  return redirectToAccidentReports(request);
}

export async function POST(request: NextRequest) {
  return redirectToAccidentReports(request);
}
