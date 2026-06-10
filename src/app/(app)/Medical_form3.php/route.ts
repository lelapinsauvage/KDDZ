import { NextRequest, NextResponse } from "next/server";

import { resolveLegacyChildId } from "@/lib/legacy-child";
import { resolveLegacyMedicalFormId } from "@/lib/legacy-medical-form";

export const runtime = "nodejs";

async function redirectToMedicalVisitForm(request: NextRequest) {
  const fid = request.nextUrl.searchParams.get("fid")?.trim();
  const id = request.nextUrl.searchParams.get("id")?.trim();

  if (fid) {
    const formId = await resolveLegacyMedicalFormId("VISITS", fid);
    if (!formId) {
      return new NextResponse("Medical visit form not found", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
    return NextResponse.redirect(new URL(`/medical/visits/${encodeURIComponent(formId)}`, request.url));
  }

  if (id) {
    const childId = await resolveLegacyChildId(id);
    if (!childId) {
      return new NextResponse("Child not found", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
    const target = new URL("/medical/visits/new", request.url);
    target.searchParams.set("childId", childId);
    return NextResponse.redirect(target);
  }

  return NextResponse.redirect(new URL("/medical/visits", request.url));
}

export async function GET(request: NextRequest) {
  return redirectToMedicalVisitForm(request);
}

export async function POST(request: NextRequest) {
  return redirectToMedicalVisitForm(request);
}
