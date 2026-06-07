import { NextRequest } from "next/server";
import { POST as parentMessagesPost } from "@/app/api/parent/messages/route";
import { forwardLegacyWsRoute } from "@/lib/legacy-parent-ws-bridge";

export function POST(request: NextRequest) {
  return forwardLegacyWsRoute(request, parentMessagesPost);
}
