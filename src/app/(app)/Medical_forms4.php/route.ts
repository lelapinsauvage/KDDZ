import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function redirectToVaccinationForms(request: NextRequest) {
  return NextResponse.redirect(new URL("/medical/vaccinations", request.url));
}

export async function GET(request: NextRequest) {
  return redirectToVaccinationForms(request);
}

export async function POST(request: NextRequest) {
  return redirectToVaccinationForms(request);
}
