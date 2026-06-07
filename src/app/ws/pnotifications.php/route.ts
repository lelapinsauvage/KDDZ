import { NextRequest } from "next/server";
import { POST as parentPushTokenPost } from "@/app/api/parent/push-token/route";
import { forwardLegacyWsRoute } from "@/lib/legacy-parent-ws-bridge";

export function POST(request: NextRequest) {
  return forwardLegacyWsRoute(request, parentPushTokenPost);
}
