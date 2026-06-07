import { type NextRequest } from "next/server";

import { legacyForgotGet, legacyForgotPost } from "@/lib/legacy-forgot-route";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  return legacyForgotGet(request);
}

export async function POST(request: NextRequest) {
  return legacyForgotPost(request);
}
