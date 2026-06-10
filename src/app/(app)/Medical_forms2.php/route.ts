import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function redirectToSufferingForms(request: NextRequest) {
  return NextResponse.redirect(new URL("/medical/conditions", request.url));
}

export async function GET(request: NextRequest) {
  return redirectToSufferingForms(request);
}

export async function POST(request: NextRequest) {
  return redirectToSufferingForms(request);
}
