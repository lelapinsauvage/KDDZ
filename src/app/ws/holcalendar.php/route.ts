import { NextRequest } from "next/server";
import {
  GET as parentHolidayCalendarGet,
  POST as parentHolidayCalendarPost,
} from "@/app/api/parent/calendar/holidays/route";
import { forwardLegacyWsRoute } from "@/lib/legacy-parent-ws-bridge";

export function GET(request: NextRequest) {
  return forwardLegacyWsRoute(request, parentHolidayCalendarGet);
}

export function POST(request: NextRequest) {
  return forwardLegacyWsRoute(request, parentHolidayCalendarPost);
}
