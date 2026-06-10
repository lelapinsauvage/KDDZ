import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function redirectToGeneralForms(request: NextRequest) {
  return NextResponse.redirect(new URL("/medical/general", request.url));
}

export async function GET(request: NextRequest) {
  return redirectToGeneralForms(request);
}

export async function POST(request: NextRequest) {
  return redirectToGeneralForms(request);
}
