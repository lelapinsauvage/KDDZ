import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildChildDailyComplianceDetails } from "@/lib/child-dashboard-compliance";

const day = (date: string) => new Date(`${date}T12:00:00.000Z`);

const child = {
  id: "child-1",
  childNumber: "C-001",
  legacyId: 1001,
  firstName: "Maya",
  lastName: "Saab",
  class: { name: "Bunnies" },
};

const fixture = {
  child,
  start: day("2026-06-01"),
  endExclusive: day("2026-06-09"),
  reports: [
    {
      reportDate: day("2026-06-01"),
      status: "SUBMITTED" as const,
      legacyData: { status: "present" },
    },
    {
      reportDate: day("2026-06-02"),
      status: "SUBMITTED" as const,
      legacyData: { status: "absent" },
    },
    {
      reportDate: day("2026-06-03"),
      status: "DRAFT" as const,
      legacyData: { status: "present" },
    },
    {
      reportDate: day("2026-06-04"),
      status: "SUBMITTED" as const,
      legacyData: { status: "absent" },
    },
  ],
  absenceReports: [
    {
      date: day("2026-06-04"),
      absentFrom: day("2026-06-04"),
      absentTo: day("2026-06-04"),
    },
  ],
  holidays: [
    {
      date: day("2026-06-05"),
      endDate: null,
      repeated: false,
    },
    {
      date: day("2027-06-06"),
      endDate: null,
      repeated: true,
    },
  ],
};

const details = buildChildDailyComplianceDetails(fixture);

assert.deepEqual(details.stats, {
  totalAttendance: 1,
  totalAbsence: 2,
  missingDailyReports: 1,
  missingAbsentReports: 1,
});

assert.deepEqual(details.missingDailyRows, [
  {
    id: "missing-daily:child-1:2026-06-08",
    number: "C-001",
    name: "Maya Saab (Bunnies)",
    date: "2026-06-08",
    href: "/daily-reports/new?childId=child-1&date=2026-06-08",
    actionLabel: "Create",
  },
]);

assert.deepEqual(details.missingAbsentRows, [
  {
    id: "missing-absent:child-1:2026-06-02",
    number: "C-001",
    name: "Maya Saab (Bunnies)",
    date: "2026-06-02",
    href: "/absent-reports/new?childId=child-1&date=2026-06-02",
    actionLabel: "Create",
  },
]);

const statsOnly = buildChildDailyComplianceDetails({
  ...fixture,
  includeRows: false,
});

assert.deepEqual(statsOnly.stats, details.stats);
assert.deepEqual(statsOnly.missingDailyRows, []);
assert.deepEqual(statsOnly.missingAbsentRows, []);

const repoRoot = process.cwd();
const childDashboardAction = readFileSync(join(repoRoot, "src/lib/actions/dashboard.ts"), "utf8");
const childDashboardPage = readFileSync(
  join(repoRoot, "src/app/(app)/children/[id]/dashboard/page.tsx"),
  "utf8",
);
const childDashboardClient = readFileSync(
  join(repoRoot, "src/app/(app)/children/[id]/dashboard/dashboard-client.tsx"),
  "utf8",
);
const dashboardDrilldownCard = readFileSync(
  join(repoRoot, "src/components/dashboard/dashboard-drilldown-card.tsx"),
  "utf8",
);
const legacyChildDashboardJs = readFileSync(
  join(
    repoRoot,
    "../Garderie Project/Garderie-old-backup/Front/templates/admin/js/child_dashboard.js",
  ),
  "utf8",
);

assert.match(legacyChildDashboardJs, /#year_sel"\)\.on\("change"[\s\S]*db_curr = \$\("#year_sel"\)\.val\(\)[\s\S]*getvalues\(\)/);
assert.match(legacyChildDashboardJs, /getchilddashboardHashed[\s\S]*db_curr\s*:\s*db_curr/);
assert.match(legacyChildDashboardJs, /lengthMenu[\s\S]*\[10,\s*20,\s*50,\s*100,\s*150,\s*-1\][\s\S]*getMissingAbsentReports/);
assert.match(legacyChildDashboardJs, /lengthMenu[\s\S]*\[10,\s*20,\s*50,\s*100,\s*150,\s*-1\][\s\S]*getMissingReports/);

assert.match(childDashboardPage, /searchParams\?: Promise<\{ year\?: string \| string\[\] \}>/);
assert.match(childDashboardPage, /selectedYearId = typeof query\?\.year === "string" \? query\.year : null/);
assert.match(childDashboardPage, /getChildDailyComplianceStats\(id, \{ schoolYearId: selectedYearId \}\)/);
assert.match(childDashboardClient, /useAppContext\(\)/);
assert.match(childDashboardClient, /params\.set\("year", selectedYear\.id\)/);
assert.match(childDashboardClient, /schoolYearId: effectiveYearId/);
assert.match(dashboardDrilldownCard, /pageSizeOptions=\{\[10, 20, 50, 100, 150, "all"\]\}/);
assert.match(dashboardDrilldownCard, /exportOptions=\{\{/);
assert.match(dashboardDrilldownCard, /printOptions=\{\{ label: "Print" \}\}/);
assert.match(childDashboardAction, /getChildDashboardRange\(orgId, range\.schoolYearId\)/);
assert.match(childDashboardAction, /where: \{ id: schoolYearId, organizationId: orgId \}/);
assert.match(childDashboardAction, /getChildDailyComplianceDetails\(orgId, requestedChildId, range\)/);

console.log("child dashboard missing-report year/export drilldown assertions passed");
