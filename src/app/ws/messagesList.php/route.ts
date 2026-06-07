import { NextRequest } from "next/server";
import {
  GET as parentMessagesGet,
  POST as parentMessagesPost,
} from "@/app/api/parent/messages/[childId]/route";
import { forwardLegacyChildWsRoute } from "@/lib/legacy-parent-ws-bridge";

export function GET(request: NextRequest) {
  return forwardLegacyChildWsRoute(request, parentMessagesGet);
}

export function POST(request: NextRequest) {
  return forwardLegacyChildWsRoute(request, parentMessagesPost);
}
