import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const families = [
  {
    label: "birthday",
    route: "birthday-alarms",
    action: "generateBirthdayAlarms",
    jobFile: "birthday-alarms",
    jobFunction: "generateBirthdayAlarmsForOrganization",
  },
  {
    label: "assessment",
    route: "assessment-alarms",
    action: "generateAssessmentAlarms",
    jobFile: "assessment-alarms",
    jobFunction: "generateAssessmentAlarmsForOrganization",
  },
  {
    label: "medical",
    route: "medical-alarms",
    action: "generateMedicalAlarms",
    jobFile: "medical-alarms",
    jobFunction: "generateMedicalAlarmsForOrganization",
  },
  {
    label: "medicine",
    route: "medicine-alarms",
    action: "generateMedicineAlarms",
    jobFile: "medicine-alarms",
    jobFunction: "generateMedicineAlarmsForOrganization",
  },
  {
    label: "insurance",
    route: "insurance-alarms",
    action: "generateInsuranceAlarms",
    jobFile: "insurance-alarms",
    jobFunction: "generateInsuranceAlarmsForOrganization",
  },
  {
    label: "vaccination",
    route: "vaccination-alarms",
    action: "generateVaccinationAlarms",
    jobFile: "vaccination-alarms",
    jobFunction: "generateVaccinationAlarmsForOrganization",
  },
  {
    label: "payment",
    route: "payment-alarms",
    action: "generatePaymentAlarms",
    jobFile: "payment-alarms",
    jobFunction: "generatePaymentAlarmsForOrganization",
  },
  {
    label: "holiday",
    route: "holiday-alarms",
    action: "generateHolidayAlarms",
    jobFile: "holiday-alarms",
    jobFunction: "generateHolidayAlarmsForOrganization",
  },
  {
    label: "event",
    route: "event-alarms",
    action: "generateEventAlarms",
    jobFile: "event-alarms",
    jobFunction: "generateEventAlarmsForOrganization",
  },
  {
    label: "contract",
    route: "contract-alarms",
    action: "generateContractAlarms",
    jobFile: "contract-alarms",
    jobFunction: "generateContractAlarmsForOrganization",
  },
] as const;

const files = {
  actions: "src/lib/actions/alarms.ts",
  cronMatrix: "docs/cron-notification-matrix.md",
  topGaps: "docs/top-20-restoration-gaps.md",
  productionGates: "docs/legacy-production-acceptance-gates.md",
};

const actions = readFileSync(files.actions, "utf8");
const cronMatrix = readFileSync(files.cronMatrix, "utf8");
const topGaps = readFileSync(files.topGaps, "utf8");
const productionGates = readFileSync(files.productionGates, "utf8");

for (const family of families) {
  const routePath = `src/app/api/cron/${family.route}/route.ts`;
  const jobPath = `src/lib/jobs/${family.jobFile}.ts`;

  assert.ok(existsSync(routePath), `${family.label} cron route is missing`);
  assert.ok(existsSync(jobPath), `${family.label} job file is missing`);

  const route = readFileSync(routePath, "utf8");
  const job = readFileSync(jobPath, "utf8");

  assert.match(route, new RegExp(family.jobFunction), `${family.label} route must call its job`);
  assert.match(route, /CRON_SECRET/);
  assert.match(route, /VERCEL_CRON_SECRET/);
  assert.match(route, /authorization === `Bearer \$\{secret\}`/);
  assert.match(route, /export async function GET\(request: NextRequest\)/);
  assert.match(route, /export async function POST\(request: NextRequest\)/);
  assert.match(route, /organizationId/);
  assert.match(route, /branchId/);

  assert.match(actions, new RegExp(`export async function ${family.action}\\(`));
  assert.match(actions, new RegExp(`${family.jobFunction}\\(\\{[\\s\\S]*organizationId: ctx\\.organizationId,[\\s\\S]*branchId,`));
  assert.match(job, new RegExp(`export async function ${family.jobFunction}\\(`));
  assert.match(job, /idempotent|skippedExisting|existing/i);
  assert.match(job, /legacy|Legacy/);
}

for (const marker of [
  "Local approved generator jobs, manual actions, and protected cron-safe endpoints are restored",
  "birthday, assessment, insurance, vaccination, payment, event, holiday, medical, and contract generation now have idempotent manual/server/cron-safe paths",
  "Local approved generator endpoints are closed",
  "remaining acceptance is hosted scheduler configuration",
  "production crontab recovery",
  "confirm hosted schedule enablement",
  "encrypted `Medical_form1.php?id=` generated-row bridge parity",
  "current-user teacher scoping, USER/PARENT_USER/CHILD sent-history tabs, and browser visual parity",
  "Alarm pages, migrated/generated receipts, New/Viewed filters, row/bulk/all mark-viewed actions",
  "Configure hosted schedules after production crontab confirmation",
]) {
  assert.ok(cronMatrix.includes(marker), `cron matrix missing marker: ${marker}`);
}

assert.doesNotMatch(cronMatrix, /remaining restoration work is future job generation/);
assert.doesNotMatch(cronMatrix, /exact encrypted deep-link parity/);
assert.doesNotMatch(cronMatrix, /Finish exact legacy active table\/status semantics, final visual audit/);
assert.doesNotMatch(cronMatrix, /Add hosted schedules and preserve read-state semantics/);

assert.match(
  topGaps,
  /Local approved cron\/job generation is closed for birthday, assessment, missing medical report, medicine, insurance, vaccination, payment, event, holiday, and contract families/,
);
assert.match(topGaps, /remaining work is hosted schedule configuration after production crontab confirmation/);
assert.doesNotMatch(topGaps, /Remaining work is idempotent cron\/job generation for any other approved legacy families/);

assert.match(productionGates, /PROD-CRON/);
assert.match(productionGates, /Production crontab and hosted scheduler cutover/);
assert.match(productionGates, /configure hosted daily and 10-minute schedules only for approved families/);

console.log("legacy cron surface closure contract assertions passed");
