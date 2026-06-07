import { NextRequest } from "next/server";
import {
  GET as parentFoodCalendarGet,
  POST as parentFoodCalendarPost,
} from "@/app/api/parent/calendar/food/route";
import { forwardLegacyWsRoute } from "@/lib/legacy-parent-ws-bridge";

export function GET(request: NextRequest) {
  return forwardLegacyWsRoute(request, parentFoodCalendarGet);
}

export function POST(request: NextRequest) {
  return forwardLegacyWsRoute(request, parentFoodCalendarPost);
}
