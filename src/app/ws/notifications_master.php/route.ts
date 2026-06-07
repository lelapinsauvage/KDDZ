import { NextRequest } from "next/server";
import {
  GET as parentNotificationsGet,
  POST as parentNotificationsPost,
} from "@/app/api/parent/notifications/[childId]/route";
import { forwardLegacyChildWsRoute } from "@/lib/legacy-parent-ws-bridge";

export function GET(request: NextRequest) {
  return forwardLegacyChildWsRoute(request, parentNotificationsGet);
}

export function POST(request: NextRequest) {
  return forwardLegacyChildWsRoute(request, parentNotificationsPost);
}
