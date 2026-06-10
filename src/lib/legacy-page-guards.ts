import type { LegacyAccessPermissionDecision } from "@/lib/legacy-access-permissions";

export const LEGACY_NAV_PAGE_NAMES = [
  "index.php",
  "branches.php",
  "classes.php",
  "accounting.php",
  "Monthly_report.php",
  "message_portal.php",
  "message_portal_single.php",
  "Msg_list.php",
  "children.php",
  "children_drafts.php",
  "calls.php",
  "dailyreports.php",
  "dailyreportsd.php",
  "absentreports.php",
  "absentreportsD.php",
  "medical_reports.php",
  "parent_users.php",
  "food.php",
  "food_calendar.php",
  "nurses.php",
  "doctors.php",
  "managers.php",
  "teachers.php",
  "calendar.php",
  "attendance.php",
  "PA_logs.php",
  "holiday_calendar.php",
  "NotifCalendar.php",
  "Address.php",
  "Alarms.php",
  "newyear.php",
] as const;

const LEGACY_EXTRA_GUARDED_PAGE_NAMES = [
  "Branch_Dashboard.php",
  "absentreport.php",
  "assessment.php",
  "call.php",
  "child_absence.php",
  "child_accident.php",
  "child_accounting.php",
  "child_attend_det.php",
  "child_calls.php",
  "child_dashboard.php",
  "class_dashboard.php",
  "medical_report.php",
  "message_portal_class.php",
  "nurseryinfo.php",
] as const;

export const LEGACY_GUARDED_PAGE_NAMES = [
  ...LEGACY_NAV_PAGE_NAMES,
  ...LEGACY_EXTRA_GUARDED_PAGE_NAMES,
] as const;

type LegacyGuardedPageName = (typeof LEGACY_GUARDED_PAGE_NAMES)[number];

type LegacyPageRouteRule = {
  legacyPage: LegacyGuardedPageName;
  exact?: string[];
  prefixes?: string[];
  patterns?: RegExp[];
};

const LEGACY_PAGE_ROUTE_RULES: LegacyPageRouteRule[] = [
  {
    legacyPage: "Branch_Dashboard.php",
    exact: ["/Branch_Dashboard.php"],
    patterns: [/^\/branches\/[^/]+\/dashboard$/],
  },
  {
    legacyPage: "class_dashboard.php",
    exact: ["/class_dashboard.php"],
    patterns: [/^\/classes\/[^/]+$/],
  },
  {
    legacyPage: "child_dashboard.php",
    exact: ["/child_dashboard.php"],
    patterns: [/^\/children\/[^/]+\/dashboard$/],
  },
  {
    legacyPage: "child_attend_det.php",
    exact: ["/child_attend_det.php", "/Child_attend_det.php"],
    patterns: [/^\/children\/[^/]+\/attendance$/],
  },
  {
    legacyPage: "child_accounting.php",
    exact: ["/child_accounting.php"],
    patterns: [/^\/children\/[^/]+\/accounting$/],
  },
  {
    legacyPage: "child_calls.php",
    exact: ["/child_calls.php"],
    patterns: [/^\/children\/[^/]+\/calls$/],
  },
  {
    legacyPage: "child_absence.php",
    exact: ["/child_absence.php"],
    patterns: [/^\/children\/[^/]+\/absence$/],
  },
  {
    legacyPage: "child_accident.php",
    exact: ["/child_accident.php"],
    patterns: [/^\/children\/[^/]+\/accidents$/],
  },
  {
    legacyPage: "absentreportsD.php",
    exact: ["/absent-reports/drafts", "/absentreportsD.php"],
    prefixes: ["/absent-reports/drafts/"],
  },
  {
    legacyPage: "absentreport.php",
    exact: ["/absentreport.php"],
    patterns: [
      /^\/absent-reports\/new$/,
      /^\/absent-reports\/[^/]+$/,
      /^\/absent-reports\/[^/]+\/edit$/,
    ],
  },
  {
    legacyPage: "children_drafts.php",
    exact: ["/children/drafts", "/children_drafts.php"],
  },
  {
    legacyPage: "dailyreportsd.php",
    exact: ["/daily-reports/drafts", "/dailyreportsd.php"],
    prefixes: ["/daily-reports/drafts/"],
  },
  {
    legacyPage: "message_portal_single.php",
    exact: ["/messages/compose/direct", "/message_portal_single.php"],
    prefixes: ["/messages/compose/direct/"],
  },
  {
    legacyPage: "message_portal_class.php",
    exact: ["/messages/compose/class", "/message_portal_class.php"],
    prefixes: ["/messages/compose/class/"],
  },
  {
    legacyPage: "message_portal.php",
    exact: ["/messages/compose", "/message_portal.php"],
    prefixes: ["/messages/compose/"],
  },
  {
    legacyPage: "Msg_list.php",
    exact: ["/messages/sent", "/Msg_list.php"],
    prefixes: ["/messages/sent/"],
  },
  {
    legacyPage: "Monthly_report.php",
    exact: ["/reports/monthly", "/reports/monthly-branch", "/Monthly_report.php", "/Monthly_report_b.php"],
    prefixes: ["/reports/monthly/", "/reports/monthly-branch/"],
  },
  {
    legacyPage: "accounting.php",
    exact: ["/accounting", "/child_accounting.php"],
  },
  {
    legacyPage: "children.php",
    exact: ["/invo.php"],
    patterns: [/^\/accounting\/invoice\/[^/]+$/],
  },
  {
    legacyPage: "call.php",
    exact: ["/call.php"],
    patterns: [/^\/calls\/[^/]+$/],
  },
  {
    legacyPage: "calls.php",
    exact: ["/calls", "/calls.php", "/bcalls.php"],
    prefixes: ["/calls/"],
  },
  {
    legacyPage: "children.php",
    exact: ["/dailyreport.php", "/child_report.php"],
    patterns: [
      /^\/daily-reports\/new$/,
      /^\/daily-reports\/batch$/,
      /^\/daily-reports\/[^/]+$/,
      /^\/daily-reports\/[^/]+\/edit$/,
      /^\/daily-reports\/[^/]+\/print$/,
    ],
  },
  {
    legacyPage: "dailyreports.php",
    exact: ["/daily-reports"],
    prefixes: ["/daily-reports/"],
  },
  {
    legacyPage: "absentreports.php",
    exact: ["/absent-reports", "/absentreports.php", "/child_absence.php"],
    prefixes: ["/absent-reports/"],
  },
  {
    legacyPage: "assessment.php",
    exact: [
      "/assessments",
      "/assessment_1.php",
      "/assessment_2.php",
      "/assessment_3.php",
      "/assessment_4.php",
      "/assessment_5.php",
      "/assessment_6.php",
      "/assessment_7.php",
    ],
    prefixes: ["/assessments/"],
  },
  {
    legacyPage: "medical_report.php",
    exact: [
      "/Medical_form1.php",
      "/Medical_form2.php",
      "/Medical_form3.php",
      "/Medical_form4.php",
      "/Medical_form5.php",
    ],
    patterns: [
      /^\/medical\/general\/[^/]+$/,
      /^\/medical\/conditions\/[^/]+$/,
      /^\/medical\/visits\/[^/]+$/,
      /^\/medical\/vaccinations\/[^/]+$/,
      /^\/medical\/accidents\/[^/]+$/,
      /^\/medical\/suffering\/[^/]+$/,
    ],
  },
  {
    legacyPage: "medical_reports.php",
    exact: [
      "/medical",
      "/Medical_forms1.php",
      "/Medical_forms2.php",
      "/Medical_forms3.php",
      "/Medical_forms4.php",
      "/Medical_forms5.php",
      "/Medical_forms5b.php",
    ],
    prefixes: ["/medical/"],
  },
  {
    legacyPage: "parent_users.php",
    exact: ["/settings/parent-users", "/parent_users.php", "/parent_user.php"],
    prefixes: ["/settings/parent-users/"],
  },
  {
    legacyPage: "food_calendar.php",
    exact: ["/food/calendar", "/food_calendar.php", "/printFoodCal.php"],
    prefixes: ["/food/calendar/"],
  },
  {
    legacyPage: "food.php",
    exact: ["/food", "/food.php"],
    prefixes: ["/food/"],
  },
  {
    legacyPage: "nurses.php",
    exact: ["/employees/nurses", "/nurses.php", "/Nurse_Details.php"],
    prefixes: ["/employees/nurses/"],
  },
  {
    legacyPage: "doctors.php",
    exact: ["/employees/doctors", "/doctors.php", "/Doctor_Details.php"],
    prefixes: ["/employees/doctors/"],
  },
  {
    legacyPage: "managers.php",
    exact: ["/employees/managers", "/managers.php", "/Manager_Details.php"],
    prefixes: ["/employees/managers/"],
  },
  {
    legacyPage: "teachers.php",
    exact: ["/employees/teachers", "/teachers.php", "/Teacher_Details.php"],
    prefixes: ["/employees/teachers/"],
  },
  {
    legacyPage: "calendar.php",
    exact: ["/employees/calendar", "/calendar.php"],
    prefixes: ["/employees/calendar/"],
  },
  {
    legacyPage: "attendance.php",
    exact: ["/employees/attendance", "/attendance.php"],
    prefixes: ["/employees/attendance/"],
  },
  {
    legacyPage: "PA_logs.php",
    exact: ["/employees/attendance-logs", "/PA_logs.php"],
    prefixes: ["/employees/attendance-logs/"],
  },
  {
    legacyPage: "holiday_calendar.php",
    exact: ["/settings/holidays", "/holiday_calendar.php"],
    prefixes: ["/settings/holidays/"],
  },
  {
    legacyPage: "NotifCalendar.php",
    exact: ["/settings/events", "/NotifCalendar.php"],
    prefixes: ["/settings/events/"],
  },
  {
    legacyPage: "Address.php",
    exact: [
      "/settings/regions",
      "/settings/zones",
      "/settings/areas",
      "/regions.php",
      "/Zones_Management.php",
      "/Areas.php",
    ],
    prefixes: ["/settings/regions/", "/settings/zones/", "/settings/areas/"],
  },
  {
    legacyPage: "Alarms.php",
    exact: [
      "/alarms",
      "/alarmsBirthday.php",
      "/alarmsEvents.php",
      "/alarmsInsurance.php",
      "/alarmsMedical.php",
      "/alarmsMedicine.php",
      "/alarmsMsg.php",
      "/alarmsPayments.php",
      "/alarmsRequests.php",
      "/alarmsVaccinations.php",
    ],
    prefixes: ["/alarms/"],
  },
  {
    legacyPage: "newyear.php",
    exact: ["/settings/new-year", "/newyear.php"],
    prefixes: ["/settings/new-year/"],
  },
  {
    legacyPage: "branches.php",
    exact: [
      "/branches",
      "/branches.php",
      "/branch.php",
    ],
    patterns: [/^\/branches\/[^/]+$/, /^\/branches\/[^/]+\/edit$/],
  },
  {
    legacyPage: "classes.php",
    exact: ["/classes", "/classes.php", "/class.php", "/childrenperbranch.php", "/classesperbranch.php"],
    prefixes: ["/classes/"],
    patterns: [
      /^\/branches\/[^/]+\/children$/,
      /^\/branches\/[^/]+\/classes$/,
    ],
  },
  {
    legacyPage: "children.php",
    exact: [
      "/children",
      "/children.php",
      "/Child_Details.php",
      "/child_dashboard.php",
      "/child_attend_det.php",
    ],
    prefixes: ["/children/"],
  },
  {
    legacyPage: "nurseryinfo.php",
    exact: ["/settings/nursery", "/nurseryinfo.php"],
    prefixes: ["/settings/nursery/"],
    patterns: [/^\/branches\/[^/]+\/compliance(?:\/.*)?$/],
  },
  {
    legacyPage: "index.php",
    exact: ["/dashboard", "/index.php"],
    prefixes: ["/dashboard/"],
  },
];

function normalizePathname(pathname: string | null | undefined) {
  if (!pathname) return null;

  const path = pathname.split(/[?#]/)[0] || "/";
  if (path === "/") return path;
  return path.endsWith("/") ? path.slice(0, -1) : path;
}

export function getLegacyPageNameForPath(
  pathname: string | null | undefined,
): LegacyGuardedPageName | null {
  const normalizedPath = normalizePathname(pathname);
  if (!normalizedPath) return null;

  const match = LEGACY_PAGE_ROUTE_RULES.find((rule) => {
    if (rule.exact?.includes(normalizedPath)) return true;
    if (rule.patterns?.some((pattern) => pattern.test(normalizedPath))) {
      return true;
    }
    return rule.prefixes?.some((prefix) => normalizedPath.startsWith(prefix));
  });

  return match?.legacyPage ?? null;
}

export function legacyPermissionAllows(
  decision: LegacyAccessPermissionDecision | null | undefined,
) {
  return !decision?.isConfigured || decision.isAllowed;
}
