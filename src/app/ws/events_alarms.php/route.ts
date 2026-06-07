import { NextRequest } from "next/server";
import {
  GET as parentAlarmsGet,
  POST as parentAlarmsPost,
} from "@/app/api/parent/alarms/[type]/route";
import { forwardLegacyAlarmWsRoute } from "@/lib/legacy-parent-ws-bridge";

export function GET(request: NextRequest) {
  return forwardLegacyAlarmWsRoute(request, parentAlarmsGet, "events");
}

export function POST(request: NextRequest) {
  return forwardLegacyAlarmWsRoute(request, parentAlarmsPost, "events");
}
