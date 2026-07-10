export type NativeParentSurfaceId = "ios-parent" | "android-parent" | "parent-web";
export type NativeParentJourneyId =
  | "today"
  | "daily-care"
  | "absence"
  | "food-calendar"
  | "holiday-calendar"
  | "messages"
  | "payments"
  | "notifications"
  | "full-report"
  | "push";
export type NativeParentSourceState =
  | "visible-operational"
  | "visible-placeholder"
  | "hidden-stub"
  | "background-operational"
  | "external-operational";
export type NativeParentTargetTreatment =
  | "preserve-and-redesign"
  | "repair-and-redesign"
  | "preserve-background-contract"
  | "preserve-external-handoff";
export type NativeParentTargetDomain =
  | "today"
  | "daily-care"
  | "attendance"
  | "calendar"
  | "messages"
  | "payments"
  | "activity"
  | "reports";

export type NativeParentSurfaceContract = {
  id: NativeParentSurfaceId;
  label: string;
  sourceKind: string;
  navigationModel: string;
  modernizationBoundary: string;
};

export type NativeParentEntryContract = {
  surface: NativeParentSurfaceId;
  discoveryRoute: `/${string}` | null;
  loginRoute: `/${string}`;
  modernLoginRoute: `/${string}`;
  acceptsLegacyDirectoryPrefix: boolean;
  sourceRisks: readonly string[];
};

export type NativeParentDestinationContract = {
  id: string;
  surface: NativeParentSurfaceId;
  journey: NativeParentJourneyId;
  label: string;
  navigationPosition: number | null;
  sourceState: NativeParentSourceState;
  targetDomain: NativeParentTargetDomain;
  targetTreatment: NativeParentTargetTreatment;
  legacyRoutes: readonly `/${string}`[];
  modernRoutes: readonly `/${string}`[];
  evidenceCode: string;
};

export const nativeParentSurfaceContracts: readonly NativeParentSurfaceContract[] = [
  {
    id: "ios-parent",
    label: "Legacy iOS parent app",
    sourceKind: "UIKit, Storyboard, Swift, OneSignal",
    navigationModel: "Nursery discovery and login followed by a fixed portrait tile home",
    modernizationBoundary: "Replace the client deliberately; preserve parser-safe PHP routes until native cutover evidence passes",
  },
  {
    id: "android-parent",
    label: "Legacy Android parent app",
    sourceKind: "Android Support libraries, Java, XML navigation, Retrofit",
    navigationModel: "Fixed-tenant login followed by a two-column portrait tile home",
    modernizationBoundary: "Replace the client deliberately; preserve working Retrofit payloads until native cutover evidence passes",
  },
  {
    id: "parent-web",
    label: "Current parent web portal",
    sourceKind: "Next.js client portal and parent API",
    navigationModel: "Today summary followed by six horizontally scrollable content tabs",
    modernizationBoundary: "Use as the first complete parent workflow pilot, not as proof that native clients already match it",
  },
] as const;

export const nativeParentEntryContracts: readonly NativeParentEntryContract[] = [
  {
    surface: "ios-parent",
    discoveryRoute: "/master.php",
    loginRoute: "/ws/login.php",
    modernLoginRoute: "/api/parent/login",
    acceptsLegacyDirectoryPrefix: true,
    sourceRisks: [
      "cleartext-http",
      "stored-credentials",
      "runtime-tenant-path",
      "legacy-onesignal-sdk",
    ],
  },
  {
    surface: "android-parent",
    discoveryRoute: null,
    loginRoute: "/ws/login.php",
    modernLoginRoute: "/api/parent/login",
    acceptsLegacyDirectoryPrefix: true,
    sourceRisks: [
      "cleartext-http",
      "fixed-tenant-path",
      "stored-credentials",
      "credential-literals-in-source",
      "no-push-client-found",
    ],
  },
  {
    surface: "parent-web",
    discoveryRoute: null,
    loginRoute: "/parent/login",
    modernLoginRoute: "/api/parent/login",
    acceptsLegacyDirectoryPrefix: false,
    sourceRisks: ["browser-token-storage", "all-feeds-eagerly-loaded"],
  },
] as const;

export const nativeParentDestinationContracts: readonly NativeParentDestinationContract[] = [
  {
    id: "ios-daily-care",
    surface: "ios-parent",
    journey: "daily-care",
    label: "Daily Report",
    navigationPosition: 1,
    sourceState: "visible-operational",
    targetDomain: "daily-care",
    targetTreatment: "preserve-and-redesign",
    legacyRoutes: ["/ws/newdaily.php"],
    modernRoutes: ["/api/parent/daily/[childId]/detailed"],
    evidenceCode: "ios-home-daily-newdaily",
  },
  {
    id: "ios-absence",
    surface: "ios-parent",
    journey: "absence",
    label: "Absence Report",
    navigationPosition: 2,
    sourceState: "visible-operational",
    targetDomain: "attendance",
    targetTreatment: "preserve-and-redesign",
    legacyRoutes: ["/ws/absence.php"],
    modernRoutes: ["/api/parent/absence/[childId]"],
    evidenceCode: "ios-home-absence",
  },
  {
    id: "ios-food-calendar",
    surface: "ios-parent",
    journey: "food-calendar",
    label: "Food Calendar",
    navigationPosition: 3,
    sourceState: "visible-operational",
    targetDomain: "calendar",
    targetTreatment: "preserve-and-redesign",
    legacyRoutes: ["/ws/foodcalendar.php"],
    modernRoutes: ["/api/parent/calendar/food"],
    evidenceCode: "ios-home-food",
  },
  {
    id: "ios-holiday-calendar",
    surface: "ios-parent",
    journey: "holiday-calendar",
    label: "Holiday Calendar",
    navigationPosition: 4,
    sourceState: "visible-operational",
    targetDomain: "calendar",
    targetTreatment: "preserve-and-redesign",
    legacyRoutes: ["/ws/holcalendar.php"],
    modernRoutes: ["/api/parent/calendar/holidays"],
    evidenceCode: "ios-home-holidays",
  },
  {
    id: "ios-notifications",
    surface: "ios-parent",
    journey: "notifications",
    label: "Notifications",
    navigationPosition: 5,
    sourceState: "visible-operational",
    targetDomain: "activity",
    targetTreatment: "repair-and-redesign",
    legacyRoutes: ["/ws/notifications_master.php", "/ws/notifications.php"],
    modernRoutes: ["/api/parent/notifications/[childId]"],
    evidenceCode: "ios-home-notifications-section-defect",
  },
  {
    id: "ios-payments",
    surface: "ios-parent",
    journey: "payments",
    label: "Payments",
    navigationPosition: 6,
    sourceState: "visible-operational",
    targetDomain: "payments",
    targetTreatment: "preserve-and-redesign",
    legacyRoutes: ["/ws/finance.php"],
    modernRoutes: ["/api/parent/finance/[childId]"],
    evidenceCode: "ios-home-payments",
  },
  {
    id: "ios-messages",
    surface: "ios-parent",
    journey: "messages",
    label: "Messages",
    navigationPosition: null,
    sourceState: "hidden-stub",
    targetDomain: "messages",
    targetTreatment: "repair-and-redesign",
    legacyRoutes: ["/ws/messages.php"],
    modernRoutes: ["/api/parent/messages/[childId]"],
    evidenceCode: "ios-hidden-messages-broken-callback",
  },
  {
    id: "ios-full-report",
    surface: "ios-parent",
    journey: "full-report",
    label: "Full report",
    navigationPosition: null,
    sourceState: "external-operational",
    targetDomain: "reports",
    targetTreatment: "preserve-external-handoff",
    legacyRoutes: [],
    modernRoutes: [],
    evidenceCode: "ios-login-payload-external-url",
  },
  {
    id: "ios-push",
    surface: "ios-parent",
    journey: "push",
    label: "Push registration",
    navigationPosition: null,
    sourceState: "background-operational",
    targetDomain: "activity",
    targetTreatment: "preserve-background-contract",
    legacyRoutes: ["/ws/pnotifications.php"],
    modernRoutes: ["/api/parent/push-token"],
    evidenceCode: "ios-onesignal-player-registration",
  },
  ...([
    ["android-daily-care", "daily-care", "Daily Report", 1, "/ws/daily.php", "/api/parent/daily/[childId]", "daily-care"],
    ["android-absence", "absence", "Absence Report", 2, "/ws/absence.php", "/api/parent/absence/[childId]", "attendance"],
    ["android-food-calendar", "food-calendar", "Food Calendar", 3, "/ws/foodcalendar.php", "/api/parent/calendar/food", "calendar"],
    ["android-holiday-calendar", "holiday-calendar", "Holiday Calendar", 4, "/ws/holcalendar.php", "/api/parent/calendar/holidays", "calendar"],
    ["android-payments", "payments", "Payments", 7, "/ws/finance.php", "/api/parent/finance/[childId]", "payments"],
  ] as const).map(([id, journey, label, navigationPosition, legacyRoute, modernRoute, targetDomain]) => ({
    id,
    surface: "android-parent" as const,
    journey,
    label,
    navigationPosition,
    sourceState: "visible-operational" as const,
    targetDomain,
    targetTreatment: "preserve-and-redesign" as const,
    legacyRoutes: [legacyRoute],
    modernRoutes: [modernRoute],
    evidenceCode: `${id}-retrofit`,
  })),
  {
    id: "android-notifications",
    surface: "android-parent",
    journey: "notifications",
    label: "Notifications",
    navigationPosition: 5,
    sourceState: "visible-placeholder",
    targetDomain: "activity",
    targetTreatment: "repair-and-redesign",
    legacyRoutes: [],
    modernRoutes: ["/api/parent/notifications/[childId]"],
    evidenceCode: "android-visible-empty-notifications",
  },
  {
    id: "android-messages",
    surface: "android-parent",
    journey: "messages",
    label: "Messages",
    navigationPosition: 6,
    sourceState: "visible-placeholder",
    targetDomain: "messages",
    targetTreatment: "repair-and-redesign",
    legacyRoutes: [],
    modernRoutes: ["/api/parent/messages/[childId]"],
    evidenceCode: "android-visible-empty-messages",
  },
  {
    id: "parent-web-today",
    surface: "parent-web",
    journey: "today",
    label: "Today summary",
    navigationPosition: 0,
    sourceState: "visible-operational",
    targetDomain: "today",
    targetTreatment: "preserve-and-redesign",
    legacyRoutes: [],
    modernRoutes: ["/parent"],
    evidenceCode: "parent-web-summary",
  },
  ...([
    ["parent-web-daily", "daily-care", "Daily", 1, ["/api/parent/daily/[childId]/detailed"], "daily-care"],
    ["parent-web-payments", "payments", "Payments", 2, ["/api/parent/finance/[childId]"], "payments"],
    ["parent-web-absence", "absence", "Absence", 3, ["/api/parent/absence/[childId]"], "attendance"],
    ["parent-web-messages", "messages", "Messages", 4, ["/api/parent/messages/[childId]", "/api/parent/messages/thread/[threadId]", "/api/parent/messages"], "messages"],
    ["parent-web-calendar", "food-calendar", "Calendar", 5, ["/api/parent/calendar/food", "/api/parent/calendar/holidays"], "calendar"],
    ["parent-web-notifications", "notifications", "Notifications", 6, ["/api/parent/notifications/[childId]"], "activity"],
  ] as const).map(([id, journey, label, navigationPosition, modernRoutes, targetDomain]) => ({
    id,
    surface: "parent-web" as const,
    journey,
    label,
    navigationPosition,
    sourceState: "visible-operational" as const,
    targetDomain,
    targetTreatment: "preserve-and-redesign" as const,
    legacyRoutes: [],
    modernRoutes,
    evidenceCode: `${id}-portal-tab`,
  })),
  {
    id: "parent-web-push",
    surface: "parent-web",
    journey: "push",
    label: "Push alerts",
    navigationPosition: null,
    sourceState: "background-operational",
    targetDomain: "activity",
    targetTreatment: "preserve-background-contract",
    legacyRoutes: [],
    modernRoutes: ["/api/parent/push-token"],
    evidenceCode: "parent-web-push-subscription",
  },
] as const;

export const nativeParentTargetDomains: readonly NativeParentTargetDomain[] = [
  "today",
  "daily-care",
  "attendance",
  "calendar",
  "messages",
  "payments",
  "activity",
  "reports",
] as const;
