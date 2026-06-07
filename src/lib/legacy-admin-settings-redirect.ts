type SearchParamValue = string | string[] | undefined;

export type LegacyAdminSettingsSearchParams = Record<string, SearchParamValue>;

const AUTH_TAB_DESTINATIONS: Record<string, string> = {
  general: "/settings/legacy-auth?tab=general",
  "general-options": "/settings/legacy-auth?tab=general",
  "general-options.php": "/settings/legacy-auth?tab=general",
  denied: "/settings/legacy-auth?tab=denied",
  "denied.php": "/settings/legacy-auth?tab=denied",
  integration: "/settings/legacy-auth?tab=integration",
  "integration.php": "/settings/legacy-auth?tab=integration",
  update: "/settings/legacy-auth?tab=update",
  "update.php": "/settings/legacy-auth?tab=update",
};

const TEMPLATE_DESTINATIONS: Record<string, string> = {
  "emails-welcome": "/settings/notifications?tab=templates&template=WELCOME",
  "emails-activate":
    "/settings/notifications?tab=templates&template=ACTIVATION_RESEND",
  "emails-forgot": "/settings/notifications?tab=templates&template=FORGOT_REQUEST",
  "emails-add-user": "/settings/notifications?tab=templates&template=ADD_USER",
  "emails-acct-update":
    "/settings/notifications?tab=templates&template=ACCOUNT_UPDATE_VERIFY",
  "emails-birthday": "/settings/notifications?tab=templates&template=BIRTHDAY",
  "emails-missingreports":
    "/settings/notifications?tab=templates&template=MISSING_REPORTS",
  "emails-medication": "/settings/notifications?tab=templates&template=MEDICINE",
  "emails-insurance": "/settings/notifications?tab=templates&template=INSURANCE",
  "emails-assessment":
    "/settings/notifications?tab=templates&template=ASSESSMENT",
  "emails-vaccinations":
    "/settings/notifications?tab=templates&template=VACCINATIONS",
  "emails-expiring": "/settings/notifications?tab=templates&template=CONTRACT",
  "emails-accounting": "/settings/notifications?tab=templates&template=PAYMENT",
};

const OTHER_DESTINATIONS: Record<string, string> = {
  notifications: "/settings/notifications?tab=legacy",
  "emails-control": "/settings/notifications?tab=legacy",
  "send-email": "/settings/notifications?tab=bulk",
  "user-profiles": "/settings/legacy-users/profile-fields",
  profiles: "/settings/legacy-users/profile-fields",
  reports: "/settings/legacy-users/reports",
  users: "/settings/legacy-users",
  "user-control": "/settings/legacy-users",
  "user-add": "/settings/legacy-users?new=1",
};

function firstParam(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeLegacyTab(value: string | undefined) {
  return value
    ?.trim()
    .replace(/^#/, "")
    .toLowerCase()
    .replace(/^.*\/page\//, "")
    .replace(/^\/?page\//, "")
    .replace(/\.php$/, "");
}

export function legacyAdminSettingsRedirect(
  params: LegacyAdminSettingsSearchParams,
) {
  const candidates = [
    params.tab,
    params.pane,
    params.section,
    params.page,
    params.p,
    params.hash,
    params.target,
  ]
    .map((value) => normalizeLegacyTab(firstParam(value)))
    .filter(Boolean) as string[];

  for (const candidate of candidates) {
    const destination =
      AUTH_TAB_DESTINATIONS[candidate] ??
      TEMPLATE_DESTINATIONS[candidate] ??
      OTHER_DESTINATIONS[candidate];
    if (destination) return destination;
  }

  return "/settings/legacy-auth";
}
