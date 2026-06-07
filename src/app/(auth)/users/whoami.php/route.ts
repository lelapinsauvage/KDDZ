export const dynamic = "force-dynamic";

export function GET() {
  return new Response(process.env.USER ?? process.env.LOGNAME ?? "unknown", {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
