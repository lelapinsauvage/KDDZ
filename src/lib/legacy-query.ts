export function normalizeLegacySearchQuery(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ? raw.trim().slice(0, 120) : "";
}

export function withLegacySearchQuery(
  pathname: string,
  value: string | string[] | undefined,
) {
  const query = normalizeLegacySearchQuery(value);
  if (!query) return pathname;

  const params = new URLSearchParams({ q: query });
  return `${pathname}?${params.toString()}`;
}
