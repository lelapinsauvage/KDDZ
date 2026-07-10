export type PerformanceMetricName = "TTFB" | "FCP" | "LCP" | "CLS" | "INP";
export type PerformanceMetricRating = "good" | "needs-improvement" | "poor";
export type PerformanceDeviceClass = "mobile" | "tablet" | "desktop" | "unknown";
export type PerformanceConnectionClass = "constrained" | "moderate" | "fast" | "unknown";
export type PerformanceRoleClass =
  | "administrator"
  | "manager"
  | "practitioner"
  | "clinical"
  | "parent"
  | "unknown";
export type PerformanceOrganizationSize =
  | "0-25"
  | "26-75"
  | "76-150"
  | "151-300"
  | "301+"
  | "unknown";
export type PerformanceNavigationType =
  | "navigate"
  | "reload"
  | "back-forward"
  | "back-forward-cache"
  | "prerender"
  | "unknown";

export type PerformanceMetricPayload = {
  metric: PerformanceMetricName;
  value: number;
  delta: number;
  rating: PerformanceMetricRating;
  routeFamily: string;
  device: PerformanceDeviceClass;
  connection: PerformanceConnectionClass;
  role: PerformanceRoleClass;
  organizationSize: PerformanceOrganizationSize;
  navigationType: PerformanceNavigationType;
  build: string;
};

export type PerformanceMetricValidation =
  | { valid: true; payload: PerformanceMetricPayload }
  | { valid: false; reason: string };

const metricNames = new Set<PerformanceMetricName>(["TTFB", "FCP", "LCP", "CLS", "INP"]);
const metricRatings = new Set<PerformanceMetricRating>([
  "good",
  "needs-improvement",
  "poor",
]);
const navigationTypes = new Set<PerformanceNavigationType>([
  "navigate",
  "reload",
  "back-forward",
  "back-forward-cache",
  "prerender",
  "unknown",
]);

const routeFamilies = new Set([
  "absent-reports",
  "accounting",
  "admin",
  "alarms",
  "assessments",
  "attendance",
  "branches",
  "calls",
  "children",
  "classes",
  "daily-reports",
  "dashboard",
  "employees",
  "food",
  "login",
  "medical",
  "messages",
  "parent",
  "payments",
  "reports",
  "settings",
  "today",
]);

const legacyRouteFamilies: Record<string, string> = {
  "absentreport.php": "absent-reports",
  "assessment_1.php": "assessments",
  "branch.php": "branches",
  "child_dashboard.php": "children",
  "class.php": "classes",
  "view.php": "children",
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function finiteNonNegative(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

export function performanceRouteFamily(pathname: unknown) {
  if (typeof pathname !== "string" || !pathname.trim()) return "/unknown";

  let path = pathname.trim();
  try {
    path = new URL(path, "https://kiddz.invalid").pathname;
  } catch {
    path = path.split(/[?#]/, 1)[0] ?? "";
  }

  const firstSegment = path.split("/").filter(Boolean)[0]?.toLowerCase();
  if (!firstSegment) return "/root";
  const legacyFamily = legacyRouteFamilies[firstSegment];
  if (legacyFamily) return `/${legacyFamily}`;
  return routeFamilies.has(firstSegment) ? `/${firstSegment}` : "/other";
}

export function performanceDeviceClass(viewportWidth: unknown): PerformanceDeviceClass {
  const width = finiteNonNegative(viewportWidth);
  if (width === null || width === 0) return "unknown";
  if (width <= 479) return "mobile";
  if (width <= 1024) return "tablet";
  return "desktop";
}

export function performanceConnectionClass(effectiveType: unknown): PerformanceConnectionClass {
  if (effectiveType === "slow-2g" || effectiveType === "2g") return "constrained";
  if (effectiveType === "3g") return "moderate";
  if (effectiveType === "4g") return "fast";
  return "unknown";
}

export function performanceRoleClass(role: unknown): PerformanceRoleClass {
  if (typeof role !== "string") return "unknown";
  switch (role.trim().toUpperCase()) {
    case "ADMIN":
      return "administrator";
    case "MANAGER":
      return "manager";
    case "TEACHER":
      return "practitioner";
    case "NURSE":
    case "DOCTOR":
      return "clinical";
    case "PARENT":
      return "parent";
    default:
      return "unknown";
  }
}

export function performanceOrganizationSize(activeChildren: unknown): PerformanceOrganizationSize {
  const count = finiteNonNegative(activeChildren);
  if (count === null) return "unknown";
  if (count <= 25) return "0-25";
  if (count <= 75) return "26-75";
  if (count <= 150) return "76-150";
  if (count <= 300) return "151-300";
  return "301+";
}

function performanceBuild(build: unknown) {
  if (typeof build !== "string") return "unknown";
  const normalized = build.trim();
  return /^[A-Za-z0-9._-]{1,64}$/.test(normalized) ? normalized : "unknown";
}

export function validatePerformanceMetric(input: unknown): PerformanceMetricValidation {
  const candidate = record(input);
  if (!candidate) return { valid: false, reason: "Performance metric must be an object" };

  const metric = candidate.metric;
  if (typeof metric !== "string" || !metricNames.has(metric as PerformanceMetricName)) {
    return { valid: false, reason: "Unsupported performance metric" };
  }

  const value = finiteNonNegative(candidate.value);
  const delta = finiteNonNegative(candidate.delta);
  if (value === null || delta === null) {
    return { valid: false, reason: "Performance values must be finite and non-negative" };
  }

  const rating = candidate.rating;
  if (typeof rating !== "string" || !metricRatings.has(rating as PerformanceMetricRating)) {
    return { valid: false, reason: "Unsupported performance rating" };
  }

  const navigationType =
    typeof candidate.navigationType === "string" &&
    navigationTypes.has(candidate.navigationType as PerformanceNavigationType)
      ? (candidate.navigationType as PerformanceNavigationType)
      : "unknown";

  return {
    valid: true,
    payload: {
      metric: metric as PerformanceMetricName,
      value,
      delta,
      rating: rating as PerformanceMetricRating,
      routeFamily: performanceRouteFamily(candidate.pathname),
      device: performanceDeviceClass(candidate.viewportWidth),
      connection: performanceConnectionClass(candidate.effectiveType),
      role: performanceRoleClass(candidate.role),
      organizationSize: performanceOrganizationSize(candidate.activeChildren),
      navigationType,
      build: performanceBuild(candidate.build),
    },
  };
}
