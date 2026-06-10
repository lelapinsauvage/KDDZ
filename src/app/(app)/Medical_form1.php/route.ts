import { NextRequest, NextResponse } from "next/server";

import { resolveLegacyChildId } from "@/lib/legacy-child";
import { resolveLegacyMedicalFormId } from "@/lib/legacy-medical-form";

export const runtime = "nodejs";

async function redirectToGeneralMedicalForm(request: NextRequest) {
  const fid = request.nextUrl.searchParams.get("fid")?.trim();
  const id = request.nextUrl.searchParams.get("id")?.trim();

  if (fid) {
    const formId = await resolveLegacyMedicalFormId("GENERAL", fid);
    if (!formId) {
      return new NextResponse("General medical form not found", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
    return NextResponse.redirect(new URL(`/medical/general/${encodeURIComponent(formId)}`, request.url));
  }

  if (id) {
    const childId = await resolveLegacyChildId(id);
    if (!childId) {
      return new NextResponse("Child not found", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
    const target = new URL("/medical/general/new", request.url);
    target.searchParams.set("childId", childId);
    return NextResponse.redirect(target);
  }

  return NextResponse.redirect(new URL("/medical/general", request.url));
}

export async function GET(request: NextRequest) {
  return redirectToGeneralMedicalForm(request);
}

export async function POST(request: NextRequest) {
  return redirectToGeneralMedicalForm(request);
}
