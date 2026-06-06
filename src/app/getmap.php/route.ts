import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const LEGACY_FAILURE_TEXT = "No Data Found Try Again";

type LegacyMapPayload =
  | { mode: "address"; address: string }
  | { mode: "coordinates"; latitude: number; longitude: number };

interface GoogleGeocodeResponse {
  status?: string;
  results?: Array<{
    formatted_address?: string;
    geometry?: {
      location?: {
        lat?: number;
        lng?: number;
      };
    };
  }>;
  error_message?: string;
}

function wantsJson(request: NextRequest): boolean {
  const contentType = request.headers.get("content-type") ?? "";
  const accept = request.headers.get("accept") ?? "";
  return contentType.includes("application/json") || accept.includes("application/json");
}

function textResponse(body: string, status = 200, extraHeaders?: HeadersInit) {
  return new NextResponse(body, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

function errorResponse(request: NextRequest, message: string, status: number) {
  if (wantsJson(request)) {
    return NextResponse.json(
      { success: false, error: message },
      { status, headers: { "cache-control": "no-store" } }
    );
  }

  return textResponse(LEGACY_FAILURE_TEXT, status);
}

function getGoogleMapsApiKey() {
  return (
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.GOOGLE_GEOCODING_API_KEY?.trim() ||
    ""
  );
}

function parseCoordinate(value: FormDataEntryValue | unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function isValidLatitude(value: number) {
  return value >= -90 && value <= 90;
}

function isValidLongitude(value: number) {
  return value >= -180 && value <= 180;
}

async function readPayload(request: NextRequest): Promise<LegacyMapPayload | null> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return null;

    if (body.submit_address !== undefined || body.mode === "address") {
      const address = typeof body.address === "string" ? body.address.trim() : "";
      if (!address) return null;
      return { mode: "address", address };
    }

    if (body.submit_coordinates !== undefined || body.mode === "coordinates") {
      const latitude = parseCoordinate(body.latitude);
      const longitude = parseCoordinate(body.longitude ?? body.long);
      if (
        latitude === null ||
        longitude === null ||
        !isValidLatitude(latitude) ||
        !isValidLongitude(longitude)
      ) {
        return null;
      }
      return { mode: "coordinates", latitude, longitude };
    }

    return null;
  }

  const formData = await request.formData();
  if (formData.has("submit_address")) {
    const address = String(formData.get("address") ?? "").trim();
    if (!address) return null;
    return { mode: "address", address };
  }

  if (formData.has("submit_coordinates")) {
    const latitude = parseCoordinate(formData.get("latitude"));
    const longitude = parseCoordinate(formData.get("longitude") ?? formData.get("long"));
    if (
      latitude === null ||
      longitude === null ||
      !isValidLatitude(latitude) ||
      !isValidLongitude(longitude)
    ) {
      return null;
    }
    return { mode: "coordinates", latitude, longitude };
  }

  return null;
}

async function geocode(params: URLSearchParams) {
  const response = await fetch(`${GOOGLE_GEOCODE_URL}?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) return null;
  return (await response.json()) as GoogleGeocodeResponse;
}

export async function GET(request: NextRequest) {
  if (wantsJson(request)) {
    return NextResponse.json(
      {
        success: false,
        error: "Use POST with submit_address/address or submit_coordinates/latitude/longitude.",
      },
      {
        status: 405,
        headers: {
          allow: "POST",
          "cache-control": "no-store",
        },
      }
    );
  }

  return textResponse(LEGACY_FAILURE_TEXT, 405, { allow: "POST" });
}

export async function POST(request: NextRequest) {
  const payload = await readPayload(request);
  if (!payload) {
    return errorResponse(request, "Invalid getmap.php request", 400);
  }

  const key = getGoogleMapsApiKey();
  if (!key) {
    return errorResponse(request, "Google Maps geocoding is not configured", 503);
  }

  if (payload.mode === "address") {
    const params = new URLSearchParams({
      address: payload.address,
      sensor: "false",
      key,
    });
    const data = await geocode(params);
    const location = data?.results?.[0]?.geometry?.location;

    if (data?.status !== "OK" || typeof location?.lat !== "number" || typeof location.lng !== "number") {
      return errorResponse(request, "Address could not be geocoded", 404);
    }

    if (wantsJson(request)) {
      return NextResponse.json(
        {
          success: true,
          latitude: location.lat,
          longitude: location.lng,
        },
        { headers: { "cache-control": "no-store" } }
      );
    }

    return textResponse(`latitude - ${location.lat}longitude - ${location.lng}`);
  }

  const params = new URLSearchParams({
    latlng: `${payload.latitude},${payload.longitude}`,
    sensor: "false",
    key,
  });
  const data = await geocode(params);
  const address = data?.results?.[0]?.formatted_address;

  if (data?.status !== "OK" || !address) {
    return errorResponse(request, "Coordinates could not be reverse geocoded", 404);
  }

  if (wantsJson(request)) {
    return NextResponse.json(
      {
        success: true,
        address,
      },
      { headers: { "cache-control": "no-store" } }
    );
  }

  return textResponse(address);
}
