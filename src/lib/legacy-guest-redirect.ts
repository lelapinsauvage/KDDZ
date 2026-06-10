import { db } from "@/lib/db";

const GUEST_REDIRECT_SETTING_KEY = "guest-redirect";

function inputString(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function normalizeLegacyGuestTarget(value: string | null | undefined, origin: string) {
  const raw = inputString(value);
  if (!raw) return "/login";

  try {
    const url = new URL(raw, origin);
    const pathname = url.pathname.replace(/\/+/g, "/");
    const lowerPathname = pathname.toLowerCase();
    const query = url.search;

    if (
      lowerPathname.endsWith("/users/login.php") ||
      lowerPathname.endsWith("/login.php")
    ) {
      return `/login${query}`;
    }

    const adminPath = pathname.match(/\/Front\/templates\/admin(\/.*)$/i)?.[1];
    if (adminPath) return `${adminPath}${query}`;

    if (url.origin !== origin) return "/login";
    return `${pathname}${query}${url.hash}` || "/login";
  } catch {
    const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
    if (
      withSlash.toLowerCase().endsWith("/users/login.php") ||
      withSlash.toLowerCase().startsWith("/login.php")
    ) {
      return withSlash.replace(/\/users\/login\.php/i, "/login").replace(/\/login\.php/i, "/login");
    }
    return withSlash;
  }
}

function addCallback(target: string, origin: string, callbackPath: string) {
  const url = new URL(target, origin);
  if (url.pathname === "/login" && callbackPath && callbackPath !== "/") {
    url.searchParams.set("callbackUrl", callbackPath);
  }
  return `${url.pathname}${url.search}${url.hash}` || "/login";
}

async function guestRedirectSetting() {
  const row = await db.legacySetting
    .findFirst({
      where: {
        legacyTable: { in: ["login_settings", "login_settings_man"] },
        settingKey: GUEST_REDIRECT_SETTING_KEY,
      },
      orderBy: [
        { legacyTable: "asc" },
        { sourceDatabase: "asc" },
        { legacyId: "desc" },
      ],
      select: { settingValue: true },
    })
    .catch((error) => {
      console.warn("legacy guest redirect fallback:", error);
      return null;
    });
  return row?.settingValue ?? null;
}

export async function legacyGuestRedirectPath(params: {
  origin: string;
  callbackPath: string;
}) {
  const configured = await guestRedirectSetting();
  const target = normalizeLegacyGuestTarget(configured, params.origin);
  return addCallback(target, params.origin, params.callbackPath);
}
