import { NextRequest } from "next/server";
import { POST as parentLoginPost } from "@/app/api/parent/login/route";
import { forwardLegacyWsRoute } from "@/lib/legacy-parent-ws-bridge";

export function POST(request: NextRequest) {
  return forwardLegacyWsRoute(request, parentLoginPost);
}
