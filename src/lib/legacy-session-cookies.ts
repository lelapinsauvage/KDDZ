const AUTH_SESSION_COOKIE_NAME = /^(?:__Secure-)?authjs\.session-token(?:\.\d+)?=/;

function isAuthSessionCookie(header: string) {
  return AUTH_SESSION_COOKIE_NAME.test(header.trim());
}

function isCookieCleanup(header: string) {
  return /;\s*Max-Age=0(?:;|$)/i.test(header);
}

export function stripPersistentAuthSessionCookie(header: string) {
  if (!isAuthSessionCookie(header) || isCookieCleanup(header)) return header;

  return header
    .split(";")
    .filter((part, index) => {
      if (index === 0) return true;
      const attr = part.trim().toLowerCase();
      return !attr.startsWith("expires=") && !attr.startsWith("max-age=");
    })
    .join(";");
}

export function makeAuthSessionCookiesBrowserScoped(response: Response) {
  const getSetCookie = (
    response.headers as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie;
  const setCookies = getSetCookie?.call(response.headers) ?? [];
  if (setCookies.length === 0) return response;

  const rewritten = setCookies.map(stripPersistentAuthSessionCookie);
  const next = new Response(response.body, response);
  next.headers.delete("set-cookie");
  for (const cookie of rewritten) next.headers.append("set-cookie", cookie);
  return next;
}
