const PROTOCOL_PATTERN = /^[a-z][a-z0-9+.-]*:/i;

export function normalizeLegacyInternalHref(
  href: string | null | undefined,
): string | null {
  const raw = href?.trim();
  if (!raw || raw.startsWith("#") || raw.startsWith("//")) return null;
  if (PROTOCOL_PATTERN.test(raw)) return null;

  const path = raw
    .replaceAll("\\", "/")
    .replace(/^(?:\.\.\/|\.\/)+/, "")
    .replace(/^\/+/, "");

  if (!path || path.startsWith("#") || path.includes("\0")) return null;

  return `/${path}`;
}
