import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  getNavForRole,
  isAccordion,
  isSectionAccordion,
  type NavAccordionItem,
} from "@/components/layout/app-sidebar";
import {
  getLegacyPageNameForPath,
  legacyPermissionAllows,
} from "@/lib/legacy-page-guards";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin";
const verifier = "src/scripts/verify-legacy-app-shell-contract.ts";

const legacyAlarmBar = readFileSync(`${legacyRoot}/AlarmBar.php`, "utf8");
const legacyLeftMenu = readFileSync(`${legacyRoot}/leftmenu.php`, "utf8");
const modernAlarmBar = readFileSync("src/components/layout/legacy-alarm-bar.tsx", "utf8");
const modernHeader = readFileSync("src/components/layout/header.tsx", "utf8");
const modernHeaderActions = readFileSync("src/lib/actions/header.ts", "utf8");
const modernSidebar = readFileSync("src/components/layout/app-sidebar.tsx", "utf8");
const appLayout = readFileSync("src/app/(app)/layout.tsx", "utf8");
const gateLoader = readFileSync("src/lib/legacy-notification-gates.ts", "utf8");
const matrix = JSON.parse(readFileSync("docs/page-parity-matrix.json", "utf8")) as Array<{
  legacyPhp: string;
  status: string;
  verification: string;
}>;
const matrixMd = readFileSync("docs/page-parity-matrix.md", "utf8");

const legacyAlarmNeedles = [
  /getbadgesMsg\(\)/,
  /getbadgesMedicine\(\)/,
  /getbadgesBirthday\(\)/,
  /getbadgesAssessment\(\)/,
  /getbadgesMedical\(\)/,
  /getbadges\(\)/,
  /\$_SESSION\['notif'\]\[0\]\['alarms'\]/,
  /\$_SESSION\['notif'\]\[1\]\['alarms'\]/,
  /\$_SESSION\['notif'\]\[5\]\['alarms'\]/,
  /\$_SESSION\['notif'\]\[7\]\['alarms'\]/,
  /No New Messages/,
  /No New Alarms/,
  /See All Messages/,
  /See All Medication Alarms/,
  /See All Birthdays Alarms/,
  /See All Assessment Alarms/,
  /See All Reports Reminders/,
  /Check::protectPageOrFunction\('manageSystem', 'ACTION'\)/,
];

for (const needle of legacyAlarmNeedles) {
  assert.match(legacyAlarmBar, needle);
}

const modernAlarmNeedles = [
  /aria-label="Legacy alarm bar"/,
  /key: "messages"/,
  /key: "medicine"/,
  /key: "birthdays"/,
  /key: "assessments"/,
  /key: "medical"/,
  /key: "general"/,
  /emptyLabel: "No New Messages"/,
  /emptyLabel: "No New Alarms"/,
  /seeAllLabel: "See All Messages"/,
  /seeAllLabel: "See All Medication Alarms"/,
  /seeAllLabel: "See All Birthdays Alarms"/,
  /seeAllLabel: "See All Assessment Alarms"/,
  /seeAllLabel: "See All Reports Reminders"/,
  /sourceTable: "custom_notifications_medicine"/,
  /sourceTable: "custom_notifications_birthday"/,
  /sourceTable: "custom_notifications_assessment"/,
  /sourceTable: "custom_notifications_medical"/,
  /sourceTable: "custom_notifications"/,
  /take: 4/,
  /getLegacyNotificationGateVisibility\(orgId\)/,
  /visibleKeys\.add\("medicine"\)/,
  /visibleKeys\.add\("birthdays"\)/,
  /visibleKeys\.add\("assessments"\)/,
  /visibleKeys\.add\("medical"\)/,
  /<LegacyAlarmBar families=\{legacyBadges\} \/>/,
  /initialData\?: HeaderData/,
  /import \{ getHeaderData \} from "@\/lib\/actions\/header"/,
  /const \[legacyBadges, setLegacyBadges\] = useState<HeaderLegacyBadgeFamily\[\]>\(initialData\.legacyBadges\)/,
  /setLegacyBadges\(next\.legacyBadges\)/,
  /window\.setInterval\(refreshHeader, 60000\)/,
  /document\.addEventListener\("visibilitychange", onVisibilityChange\)/,
  /Keep the server-rendered legacy header state if refresh fails\./,
  /canManageSystem &&/,
  /href="\/users\/admin"/,
];

for (const needle of modernAlarmNeedles) {
  assert.match(`${modernAlarmBar}\n${modernHeader}\n${modernHeaderActions}`, needle);
}

const legacyNavNeedles = [
  /Dashboard/,
  /Garderie Management/,
  /Classes Management/,
  /Accounting Management/,
  /Monthly Attendance/,
  /Classes/,
  /Messages/,
  /Messages Portal/,
  /Single Messaging/,
  /Sent Messages/,
  /Children Management/,
  /Children Listing/,
  /Children Drafts/,
  /Calls Management/,
  /Daily Reports/,
  /Absent Reports/,
  /Medical Reports/,
  /Parent Users/,
  /Food Management/,
  /Food Listing/,
  /Food Calendar/,
  /Employees Management/,
  /Nurses Listing/,
  /Doctors Listing/,
  /Managers Listing/,
  /Teachers Listing/,
  /Teachers Calendar/,
  /Upload Attendance/,
  /Attendance Logs/,
  /Setting/,
  /Holiday Calendar/,
  /Events Calendar/,
  /Address Management/,
  /Notifications/,
  /New Year/,
];

for (const needle of legacyNavNeedles) {
  assert.match(legacyLeftMenu, needle);
}

const modernNavNeedles = [
  ...legacyNavNeedles.filter((needle) => String(needle) !== String(/New Year/)),
  /New Academic Year/,
];

for (const needle of modernNavNeedles) {
  assert.match(modernSidebar, needle);
}

for (const page of [
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
]) {
  assert.match(legacyLeftMenu, new RegExp(page.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(modernSidebar, new RegExp(`legacyPage: "${page.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
}

assert.match(gateLoader, /medicine: 0/);
assert.match(gateLoader, /birthdays: 1/);
assert.match(gateLoader, /general: 2/);
assert.match(gateLoader, /events: 2/);
assert.match(gateLoader, /insurance: 3/);
assert.match(gateLoader, /vaccinations: 4/);
assert.match(gateLoader, /assessments: 5/);
assert.match(gateLoader, /medical: 7/);
assert.match(gateLoader, /payments: 9/);

const branches = [
  { id: "branch-one", name: "Branch One" },
  { id: "branch two", name: "Branch Two" },
];
const classes = [
  { id: "class-one", name: "Toddlers", branch: { id: "branch-one", name: "Branch One" } },
  { id: "class-two", name: "Preschool", branch: { id: "branch two", name: "Branch Two" } },
];

const sections = getNavForRole("ADMIN", classes, branches, {
  medicine: false,
  birthdays: false,
  general: true,
  events: false,
  insurance: false,
  vaccinations: false,
  assessments: false,
  medical: false,
  payments: false,
});

const labels = sections.map((section) => section.label);
assert.deepEqual(labels.slice(0, 4), [
  "Dashboard",
  "Garderie Management",
  "Classes",
  "Messages",
]);

const classesSection = sections.find((section) => section.label === "Classes");
assert.ok(classesSection && isSectionAccordion(classesSection));
assert.equal(classesSection.children.length, 2);
assert.ok(classesSection.children.every(isAccordion), "classes are grouped by branch when multiple branches exist");

const foodSection = sections.find((section) => section.label === "Food Management");
assert.ok(foodSection && isSectionAccordion(foodSection));
const foodCalendar = foodSection.children.find(
  (item): item is NavAccordionItem => isAccordion(item) && item.title === "Food Calendar",
);
assert.ok(foodCalendar);
assert.deepEqual(
  foodCalendar.children.map((item) => {
    assert.ok(!isAccordion(item));
    return { title: item.title, href: item.href, legacyPage: item.legacyPage };
  }),
  [
    { title: "Branch One", href: "/food/calendar?branch=branch-one", legacyPage: "food_calendar.php" },
    { title: "Branch Two", href: "/food/calendar?branch=branch%20two", legacyPage: "food_calendar.php" },
  ],
);

const settingsSection = sections.find((section) => section.label === "Setting");
assert.ok(settingsSection && isSectionAccordion(settingsSection));
const notifications = settingsSection.children.find(
  (item): item is NavAccordionItem => isAccordion(item) && item.title === "Notifications",
);
assert.ok(notifications);
const notificationTitles = notifications.children.map((item) => {
  assert.ok(!isAccordion(item));
  return item.title;
});
assert.deepEqual(notificationTitles, ["Overview", "Requests", "Messages", "Others", "Contracts"]);

const deniedSections = getNavForRole("ADMIN", [], branches, null, {
  "message_portal.php": { isConfigured: true, isAllowed: false },
  "message_portal_single.php": { isConfigured: true, isAllowed: false },
  "Msg_list.php": { isConfigured: true, isAllowed: false },
  "food_calendar.php": { isConfigured: true, isAllowed: false },
});
const deniedMessages = deniedSections.find((section) => section.label === "Messages");
assert.ok(deniedMessages && isSectionAccordion(deniedMessages));
assert.deepEqual(
  deniedMessages.children.map((item) => {
    assert.ok(!isAccordion(item));
    return item.title;
  }),
  ["Inbox"],
);
const deniedFood = deniedSections.find((section) => section.label === "Food Management");
assert.ok(deniedFood && isSectionAccordion(deniedFood));
assert.equal(
  deniedFood.children.some((item) => item.title === "Food Calendar"),
  false,
);

const teacherSections = getNavForRole("TEACHER", [], branches);
assert.deepEqual(
  teacherSections.map((section) => section.label),
  ["Today", "Daily Operations", "Children", "Communication"],
);

assert.equal(getLegacyPageNameForPath("/Monthly_report.php"), "Monthly_report.php");
assert.equal(getLegacyPageNameForPath("/reports/monthly"), "Monthly_report.php");
assert.equal(getLegacyPageNameForPath("/food/calendar?branch=branch-one"), "food_calendar.php");
assert.equal(getLegacyPageNameForPath("/message_portal_single.php"), "message_portal_single.php");
assert.equal(getLegacyPageNameForPath("/children/abc/dashboard"), "child_dashboard.php");
assert.equal(legacyPermissionAllows({ isConfigured: true, isAllowed: false }), false);
assert.equal(legacyPermissionAllows({ isConfigured: true, isAllowed: true }), true);
assert.equal(legacyPermissionAllows({ isConfigured: false, isAllowed: false }), true);

assert.match(appLayout, /getLegacyAccessPermissionMap/);
assert.match(appLayout, /getHeaderData\(\)/);
assert.match(appLayout, /initialData=\{headerData\}/);
assert.match(appLayout, /LEGACY_GUARDED_PAGE_NAMES/);
assert.match(appLayout, /redirect\("\/forbidden\.php"\)/);

for (const legacyPhp of ["Front/templates/admin/AlarmBar.php", "Front/templates/admin/leftmenu.php"]) {
  const row = matrix.find((entry) => entry.legacyPhp === legacyPhp);
  assert.ok(row, `matrix row exists for ${legacyPhp}`);
  assert.match(row.verification, new RegExp(verifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(matrixMd, new RegExp(`${legacyPhp.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^\\n]*${verifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
}

console.log("legacy app shell contract assertions passed");
