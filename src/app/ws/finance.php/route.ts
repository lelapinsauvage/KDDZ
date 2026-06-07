import { NextRequest } from "next/server";
import {
  GET as parentFinanceGet,
  POST as parentFinancePost,
} from "@/app/api/parent/finance/[childId]/route";
import { forwardLegacyChildWsRoute } from "@/lib/legacy-parent-ws-bridge";

export function GET(request: NextRequest) {
  return forwardLegacyChildWsRoute(request, parentFinanceGet);
}

export function POST(request: NextRequest) {
  return forwardLegacyChildWsRoute(request, parentFinancePost);
}
