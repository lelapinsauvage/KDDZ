import type { NextRequest } from "next/server";
import { dispatchLegacyParentWsEndpoint } from "@/lib/legacy-parent-ws-dispatch";

type LegacyPathWsParams = {
  legacyPath: string;
  endpoint: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<LegacyPathWsParams> }
) {
  const { endpoint } = await params;
  return dispatchLegacyParentWsEndpoint(request, endpoint);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<LegacyPathWsParams> }
) {
  const { endpoint } = await params;
  return dispatchLegacyParentWsEndpoint(request, endpoint);
}
