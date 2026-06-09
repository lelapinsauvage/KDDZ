import assert from "node:assert/strict";
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

console.log("child dashboard missing-report drilldown assertions passed");
