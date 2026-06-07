import { db } from "@/lib/db";

const LOGOUT_SETTING_KEYS = [
  "signout-redirect-referrer-enable",
  "signout-redirect-url",
] as const;

function legacyBool(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  return Boolean(
    normalized && !["0", "false", "no", "off", "null"].includes(normalized),
  );
}

function safeInternalRedirect(value: string | null | undefined, origin: string) {
  const trimmed = value?.trim();
  if (!trimmed) return "/login";

  try {
    const url = new URL(trimmed, origin);
    if (url.origin !== origin) return "/login";
    return `${url.pathname}${url.search}${url.hash}` || "/login";
  } catch {
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }
}

async function legacyLogoutSettings() {
  const rows = await db.legacySetting
    .findMany({
      where: {
        legacyTable: { in: ["login_settings", "login_settings_man"] },
        settingKey: { in: [...LOGOUT_SETTING_KEYS] },
      },
      orderBy: [
        { legacyTable: "asc" },
        { sourceDatabase: "asc" },
        { legacyId: "desc" },
      ],
      select: {
        settingKey: true,
        settingValue: true,
      },
    })
    .catch((error) => {
      console.warn("legacyLogoutSettings fallback:", error);
      return [];
    });

  const value = (key: (typeof LOGOUT_SETTING_KEYS)[number]) =>
    rows.find((row) => row.settingKey === key)?.settingValue ?? null;

  return {
    useReferrer:
      rows.length === 0 ||
      legacyBool(value("signout-redirect-referrer-enable")),
    redirectUrl: value("signout-redirect-url"),
  };
}

export async function legacyLogoutRedirectPath(request: Request) {
  const { useReferrer, redirectUrl } = await legacyLogoutSettings();
  const origin = new URL(request.url).origin;
  const referer = request.headers.get("referer");
  const target = useReferrer ? referer : redirectUrl;

  return safeInternalRedirect(target, origin);
}
