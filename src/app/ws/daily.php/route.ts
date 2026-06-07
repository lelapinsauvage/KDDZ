import { NextRequest } from "next/server";
import {
  GET as parentDailyGet,
  POST as parentDailyPost,
} from "@/app/api/parent/daily/[childId]/route";
import { forwardLegacyChildWsRoute } from "@/lib/legacy-parent-ws-bridge";

export function GET(request: NextRequest) {
  return forwardLegacyChildWsRoute(request, parentDailyGet);
}

export function POST(request: NextRequest) {
  return forwardLegacyChildWsRoute(request, parentDailyPost);
}
