import { NextRequest } from "next/server";
import {
  GET as parentDetailedDailyGet,
  POST as parentDetailedDailyPost,
} from "@/app/api/parent/daily/[childId]/detailed/route";
import { forwardLegacyChildWsRoute } from "@/lib/legacy-parent-ws-bridge";

export function GET(request: NextRequest) {
  return forwardLegacyChildWsRoute(request, parentDetailedDailyGet);
}

export function POST(request: NextRequest) {
  return forwardLegacyChildWsRoute(request, parentDetailedDailyPost);
}
