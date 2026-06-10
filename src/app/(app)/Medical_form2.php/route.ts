import { NextRequest, NextResponse } from "next/server";

import { resolveLegacyChildId } from "@/lib/legacy-child";
import { resolveLegacyMedicalFormId } from "@/lib/legacy-medical-form";

export const runtime = "nodejs";

async function redirectToConditionMedicalForm(request: NextRequest) {
  const fid = request.nextUrl.searchParams.get("fid")?.trim();
  const id = request.nextUrl.searchParams.get("id")?.trim();

  if (fid) {
    const formId = await resolveLegacyMedicalFormId("CONDITIONS", fid);
    if (!formId) {
      return new NextResponse("Suffering medical form not found", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
    return NextResponse.redirect(new URL(`/medical/conditions/${encodeURIComponent(formId)}`, request.url));
  }

  if (id) {
    const childId = await resolveLegacyChildId(id);
    if (!childId) {
      return new NextResponse("Child not found", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
    const target = new URL("/medical/conditions/new", request.url);
    target.searchParams.set("childId", childId);
    return NextResponse.redirect(target);
  }

  return NextResponse.redirect(new URL("/medical/conditions", request.url));
}

export async function GET(request: NextRequest) {
  return redirectToConditionMedicalForm(request);
}

export async function POST(request: NextRequest) {
  return redirectToConditionMedicalForm(request);
}
