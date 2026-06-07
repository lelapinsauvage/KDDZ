import { NextRequest } from "next/server";
import {
  GET as parentMessageThreadGet,
  POST as parentMessageThreadPost,
} from "@/app/api/parent/messages/thread/[threadId]/route";
import { forwardLegacyThreadWsRoute } from "@/lib/legacy-parent-ws-bridge";

export function GET(request: NextRequest) {
  return forwardLegacyThreadWsRoute(request, parentMessageThreadGet);
}

export function POST(request: NextRequest) {
  return forwardLegacyThreadWsRoute(request, parentMessageThreadPost);
}
