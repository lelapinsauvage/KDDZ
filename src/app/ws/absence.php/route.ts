import { NextRequest } from "next/server";
import {
  GET as parentAbsenceGet,
  POST as parentAbsencePost,
} from "@/app/api/parent/absence/[childId]/route";
import { forwardLegacyChildWsRoute } from "@/lib/legacy-parent-ws-bridge";

export function GET(request: NextRequest) {
  return forwardLegacyChildWsRoute(request, parentAbsenceGet);
}

export function POST(request: NextRequest) {
  return forwardLegacyChildWsRoute(request, parentAbsencePost);
}
