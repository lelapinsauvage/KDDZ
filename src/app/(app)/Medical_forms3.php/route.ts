import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function redirectToMedicalVisits(request: NextRequest) {
  return NextResponse.redirect(new URL("/medical/visits", request.url));
}

export async function GET(request: NextRequest) {
  return redirectToMedicalVisits(request);
}

export async function POST(request: NextRequest) {
  return redirectToMedicalVisits(request);
}
