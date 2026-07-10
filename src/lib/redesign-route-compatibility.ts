export type RedesignDomainId =
  | "today"
  | "children"
  | "rooms"
  | "team"
  | "messages"
  | "finance"
  | "reports"
  | "settings";

export type RedesignTargetAvailability = "live" | "planned";
export type RedesignRouteClass =
  | "target"
  | "current"
  | "legacy-alias"
  | "native-delegate"
  | "outside-staff-ia";

export type RedesignRouteObservation = {
  domain: RedesignDomainId | null;
  routeClass: RedesignRouteClass;
  analyticsKey: RedesignDomainId | "native-parent" | "other";
};

export type RedesignDomainRouteContract = {
  id: RedesignDomainId;
  label: string;
  targetRoot: `/${string}`;
  targetAvailability: RedesignTargetAvailability;
  currentLanding: `/${string}`;
  currentRoots: readonly `/${string}`[];
  contextKeys: readonly string[];
};

export type LegacyRouteStrategy =
  | "redirect"
  | "render-canonical"
  | "request-delegate";

export type LegacyIdentityRule =
  | "none"
  | "legacy-child-id"
  | "legacy-branch-id"
  | "legacy-class-id"
  | "legacy-staff-id"
  | "legacy-parent-user-id"
  | "legacy-message-id"
  | "legacy-payment-id";

export type LegacyAliasContract = {
  sourceRoute: `/${string}`;
  domain: RedesignDomainId;
  destinationTemplate: `/${string}`;
  alternateDestinationTemplates?: readonly `/${string}`[];
  strategy: LegacyRouteStrategy;
  identityRule: LegacyIdentityRule;
  acceptedQueryKeys: readonly string[];
};

const sharedOperationalContext = ["branch", "from", "to", "year", "source"] as const;

export const redesignDomainRouteContracts = [
  {
    id: "today",
    label: "Today",
    targetRoot: "/today",
    targetAvailability: "live",
    currentLanding: "/dashboard",
    currentRoots: ["/dashboard", "/today", "/alarms"],
    contextKeys: sharedOperationalContext,
  },
  {
    id: "children",
    label: "Children",
    targetRoot: "/children",
    targetAvailability: "live",
    currentLanding: "/children",
    currentRoots: [
      "/children",
      "/daily-reports",
      "/absent-reports",
      "/medical",
      "/assessments",
    ],
    contextKeys: [...sharedOperationalContext, "childId", "classId", "q"],
  },
  {
    id: "rooms",
    label: "Rooms",
    targetRoot: "/rooms",
    targetAvailability: "planned",
    currentLanding: "/classes",
    currentRoots: ["/classes", "/branches", "/food"],
    contextKeys: [...sharedOperationalContext, "classId", "roomId", "q"],
  },
  {
    id: "team",
    label: "Team",
    targetRoot: "/team",
    targetAvailability: "planned",
    currentLanding: "/employees/staff",
    currentRoots: ["/employees"],
    contextKeys: [...sharedOperationalContext, "employeeId", "q"],
  },
  {
    id: "messages",
    label: "Messages",
    targetRoot: "/messages",
    targetAvailability: "live",
    currentLanding: "/messages",
    currentRoots: ["/messages", "/calls"],
    contextKeys: [...sharedOperationalContext, "childId", "threadId", "q"],
  },
  {
    id: "finance",
    label: "Finance",
    targetRoot: "/finance",
    targetAvailability: "planned",
    currentLanding: "/accounting",
    currentRoots: ["/accounting"],
    contextKeys: [...sharedOperationalContext, "childId", "invoiceId", "q"],
  },
  {
    id: "reports",
    label: "Reports",
    targetRoot: "/reports",
    targetAvailability: "planned",
    currentLanding: "/reports/monthly",
    currentRoots: ["/reports/monthly", "/reports/monthly-branch"],
    contextKeys: [...sharedOperationalContext, "classId", "month", "q"],
  },
  {
    id: "settings",
    label: "Settings",
    targetRoot: "/settings",
    targetAvailability: "live",
    currentLanding: "/settings",
    currentRoots: ["/settings", "/users/admin"],
    contextKeys: ["branch", "year", "q"],
  },
] as const satisfies readonly RedesignDomainRouteContract[];

export const legacyAliasContracts = [
  {
    sourceRoute: "/index.php",
    domain: "today",
    destinationTemplate: "/dashboard",
    strategy: "redirect",
    identityRule: "none",
    acceptedQueryKeys: [],
  },
  {
    sourceRoute: "/children.php",
    domain: "children",
    destinationTemplate: "/children",
    strategy: "redirect",
    identityRule: "none",
    acceptedQueryKeys: [],
  },
  {
    sourceRoute: "/child_dashboard.php",
    domain: "children",
    destinationTemplate: "/children/[id]/dashboard",
    strategy: "redirect",
    identityRule: "legacy-child-id",
    acceptedQueryKeys: ["id"],
  },
  {
    sourceRoute: "/child_attend_det.php",
    domain: "children",
    destinationTemplate: "/children/[id]/attendance",
    strategy: "redirect",
    identityRule: "legacy-child-id",
    acceptedQueryKeys: ["id"],
  },
  {
    sourceRoute: "/child_calls.php",
    domain: "messages",
    destinationTemplate: "/children/[id]/calls",
    strategy: "redirect",
    identityRule: "legacy-child-id",
    acceptedQueryKeys: ["id"],
  },
  {
    sourceRoute: "/child_accounting.php",
    domain: "finance",
    destinationTemplate: "/children/[id]/accounting",
    strategy: "redirect",
    identityRule: "legacy-child-id",
    acceptedQueryKeys: ["id"],
  },
  {
    sourceRoute: "/classes.php",
    domain: "rooms",
    destinationTemplate: "/classes",
    strategy: "redirect",
    identityRule: "none",
    acceptedQueryKeys: [],
  },
  {
    sourceRoute: "/class.php",
    domain: "rooms",
    destinationTemplate: "/classes",
    strategy: "redirect",
    identityRule: "legacy-class-id",
    acceptedQueryKeys: ["id", "action"],
  },
  {
    sourceRoute: "/classesperbranch.php",
    domain: "rooms",
    destinationTemplate: "/branches/[id]/classes",
    strategy: "redirect",
    identityRule: "legacy-branch-id",
    acceptedQueryKeys: [
      "brid",
      "ids",
      "name",
      "lname",
      "language",
      "dob",
      "maxStudents",
      "from",
      "to",
      "order_date_from",
      "order_date_to",
      "q",
    ],
  },
  {
    sourceRoute: "/branches.php",
    domain: "rooms",
    destinationTemplate: "/branches",
    strategy: "redirect",
    identityRule: "none",
    acceptedQueryKeys: [],
  },
  {
    sourceRoute: "/Branch_Dashboard.php",
    domain: "rooms",
    destinationTemplate: "/branches/[id]/dashboard",
    strategy: "redirect",
    identityRule: "legacy-branch-id",
    acceptedQueryKeys: ["id", "from", "to", "year"],
  },
  {
    sourceRoute: "/teachers.php",
    domain: "team",
    destinationTemplate: "/employees/teachers",
    strategy: "redirect",
    identityRule: "none",
    acceptedQueryKeys: ["q"],
  },
  {
    sourceRoute: "/managers.php",
    domain: "team",
    destinationTemplate: "/employees/managers",
    strategy: "redirect",
    identityRule: "none",
    acceptedQueryKeys: ["q"],
  },
  {
    sourceRoute: "/nurses.php",
    domain: "team",
    destinationTemplate: "/employees/nurses",
    strategy: "redirect",
    identityRule: "none",
    acceptedQueryKeys: ["q"],
  },
  {
    sourceRoute: "/doctors.php",
    domain: "team",
    destinationTemplate: "/employees/doctors",
    strategy: "redirect",
    identityRule: "none",
    acceptedQueryKeys: ["q"],
  },
  {
    sourceRoute: "/attendance.php",
    domain: "team",
    destinationTemplate: "/employees/attendance",
    strategy: "redirect",
    identityRule: "legacy-staff-id",
    acceptedQueryKeys: ["tid", "id"],
  },
  {
    sourceRoute: "/calendar.php",
    domain: "team",
    destinationTemplate: "/employees/calendar",
    strategy: "redirect",
    identityRule: "legacy-staff-id",
    acceptedQueryKeys: ["id"],
  },
  {
    sourceRoute: "/message_portal.php",
    domain: "messages",
    destinationTemplate: "/messages/compose",
    strategy: "redirect",
    identityRule: "legacy-parent-user-id",
    acceptedQueryKeys: ["id"],
  },
  {
    sourceRoute: "/message_portal_class.php",
    domain: "messages",
    destinationTemplate: "/messages/compose/class",
    strategy: "redirect",
    identityRule: "legacy-class-id",
    acceptedQueryKeys: ["id"],
  },
  {
    sourceRoute: "/message_portal_single.php",
    domain: "messages",
    destinationTemplate: "/messages/compose/direct",
    alternateDestinationTemplates: ["/messages/[id]"],
    strategy: "redirect",
    identityRule: "legacy-message-id",
    acceptedQueryKeys: ["id", "thread"],
  },
  {
    sourceRoute: "/Msg_list.php",
    domain: "messages",
    destinationTemplate: "/messages/sent",
    strategy: "redirect",
    identityRule: "none",
    acceptedQueryKeys: [
      "q",
      "id",
      "ids",
      "from",
      "to",
      "dateFrom",
      "dateTo",
      "mind",
      "maxd",
      "order_date_from",
      "order_date_to",
      "nature",
      "subject",
      "message",
      "thread",
      "threadId",
      "order_status",
    ],
  },
  {
    sourceRoute: "/calls.php",
    domain: "messages",
    destinationTemplate: "/calls",
    strategy: "render-canonical",
    identityRule: "none",
    acceptedQueryKeys: [],
  },
  {
    sourceRoute: "/accounting.php",
    domain: "finance",
    destinationTemplate: "/accounting",
    strategy: "redirect",
    identityRule: "none",
    acceptedQueryKeys: [],
  },
  {
    sourceRoute: "/invo.php",
    domain: "finance",
    destinationTemplate: "/accounting/invoice/[id]",
    strategy: "redirect",
    identityRule: "legacy-payment-id",
    acceptedQueryKeys: ["id"],
  },
  {
    sourceRoute: "/Monthly_report.php",
    domain: "reports",
    destinationTemplate: "/reports/monthly",
    strategy: "request-delegate",
    identityRule: "none",
    acceptedQueryKeys: ["branch", "class", "classId", "from", "month", "p", "q"],
  },
  {
    sourceRoute: "/Monthly_report_b.php",
    domain: "reports",
    destinationTemplate: "/reports/monthly-branch",
    strategy: "request-delegate",
    identityRule: "legacy-branch-id",
    acceptedQueryKeys: ["branch", "brid", "from", "month", "p", "q"],
  },
  {
    sourceRoute: "/settings.php",
    domain: "settings",
    destinationTemplate: "/profile",
    strategy: "redirect",
    identityRule: "none",
    acceptedQueryKeys: [],
  },
  {
    sourceRoute: "/users.php",
    domain: "settings",
    destinationTemplate: "/settings/legacy-users",
    strategy: "redirect",
    identityRule: "none",
    acceptedQueryKeys: ["q", "uid", "user"],
  },
] as const satisfies readonly LegacyAliasContract[];

export const nativeCompatibilityRoutePatterns = [
  "/ws/*.php",
  "/[legacyPath]/ws/[endpoint]",
  "/api/parent/**",
  "/parent/**",
] as const;

function normalizedPathname(input: unknown) {
  if (typeof input !== "string" || !input.trim()) return null;

  try {
    return new URL(input.trim(), "https://kiddz.invalid").pathname.replace(/\/{2,}/g, "/");
  } catch {
    const pathname = input.trim().split(/[?#]/, 1)[0];
    return pathname?.startsWith("/") ? pathname.replace(/\/{2,}/g, "/") : null;
  }
}

function pathMatchesRoot(pathname: string, root: string) {
  const normalizedPath = pathname.toLowerCase();
  const normalizedRoot = root.toLowerCase();
  return normalizedPath === normalizedRoot || normalizedPath.startsWith(`${normalizedRoot}/`);
}

export function observeRedesignRoute(input: unknown): RedesignRouteObservation {
  const pathname = normalizedPathname(input);
  if (!pathname) {
    return { domain: null, routeClass: "outside-staff-ia", analyticsKey: "other" };
  }

  if (
    /^\/ws(?:\/|$)/i.test(pathname) ||
    /^\/[^/]+\/ws(?:\/|$)/i.test(pathname) ||
    /^\/api\/parent(?:\/|$)/i.test(pathname) ||
    /^\/parent(?:\/|$)/i.test(pathname)
  ) {
    return { domain: null, routeClass: "native-delegate", analyticsKey: "native-parent" };
  }

  const alias = legacyAliasContracts.find(
    (contract) => contract.sourceRoute.toLowerCase() === pathname.toLowerCase(),
  );
  if (alias) {
    return {
      domain: alias.domain,
      routeClass: "legacy-alias",
      analyticsKey: alias.domain,
    };
  }

  for (const contract of redesignDomainRouteContracts) {
    if (pathMatchesRoot(pathname, contract.targetRoot)) {
      return { domain: contract.id, routeClass: "target", analyticsKey: contract.id };
    }

    if (contract.currentRoots.some((root) => pathMatchesRoot(pathname, root))) {
      return { domain: contract.id, routeClass: "current", analyticsKey: contract.id };
    }
  }

  return { domain: null, routeClass: "outside-staff-ia", analyticsKey: "other" };
}
