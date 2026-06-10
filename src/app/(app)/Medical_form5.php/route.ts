import { NextRequest, NextResponse } from "next/server";

import { resolveLegacyChildId } from "@/lib/legacy-child";
import { resolveLegacyMedicalFormId } from "@/lib/legacy-medical-form";

export const runtime = "nodejs";

async function redirectToAccidentReportForm(request: NextRequest) {
  const fid = request.nextUrl.searchParams.get("fid")?.trim();
  const id = request.nextUrl.searchParams.get("id")?.trim();

  if (fid) {
    const formId = await resolveLegacyMedicalFormId("ACCIDENTS", fid);
    if (!formId) {
      return new NextResponse("Accident report not found", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
    return NextResponse.redirect(new URL(`/medical/accidents/${encodeURIComponent(formId)}`, request.url));
  }

  if (id) {
    const childId = await resolveLegacyChildId(id);
    if (!childId) {
      return new NextResponse("Child not found", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
    const target = new URL("/medical/accidents/new", request.url);
    target.searchParams.set("childId", childId);
    return NextResponse.redirect(target);
  }

  return NextResponse.redirect(new URL("/medical/accidents", request.url));
}

export async function GET(request: NextRequest) {
  return redirectToAccidentReportForm(request);
}

export async function POST(request: NextRequest) {
  return redirectToAccidentReportForm(request);
}
