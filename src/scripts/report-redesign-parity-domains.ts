import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type ParityRow = {
  legacyPhp?: string;
  legacyJs?: string;
  modernRoute?: string;
  status?: string;
};

type DomainRule = {
  id: string;
  name: string;
  patterns: RegExp[];
};

const domainRules: DomainRule[] = [
  {
    id: "P01",
    name: "Retired bundled libraries and examples",
    patterns: [
      /assets\/plugins/i,
      /\/classes\/phpexcel/i,
      /\/classes\/tcpdf/i,
      /\/classes\/lib\//i,
      /\/classes\/(connect|menu_lib|ssp\.class)\.php/i,
      /\/vendor\//i,
      /ckeditor/i,
      /datatables\/examples/i,
      /jquery-validation\/demo/i,
      /jcrop\/demo/i,
    ],
  },
  {
    id: "F22",
    name: "Parent experience and native compatibility",
    patterns: [
      /\/api\/parent\//i,
      /\/ws\//i,
      /garderie_parent/i,
      /\/parent(?:\/|$)/i,
      /parent api/i,
      /parent mobile/i,
      /native (ios|android|client)/i,
      /webfunctions\.swift/i,
      /webservicefunctions\.java/i,
    ],
  },
  {
    id: "F01",
    name: "Authentication and recovery",
    patterns: [
      /(^|\/)login/i,
      /forgot/i,
      /signup/i,
      /password/i,
      /activation/i,
      /disabled/i,
      /public.profile/i,
      /auth\/session/i,
    ],
  },
  {
    id: "F20",
    name: "Compliance and branch evidence",
    patterns: [/compliance/i, /ministry/i, /lease/i, /branch.document/i],
  },
  {
    id: "F09",
    name: "Absence workflows",
    patterns: [/absen/i, /absence/i],
  },
  {
    id: "F08",
    name: "Daily care reports",
    patterns: [/daily.report/i, /dailyreport/i, /daily\.php/i, /newdaily/i],
  },
  {
    id: "F10",
    name: "Medical and incidents",
    patterns: [
      /medical/i,
      /vaccin/i,
      /accident/i,
      /suffering/i,
      /medicine/i,
      /health/i,
      /form_[1-7]/i,
      /medical_form/i,
    ],
  },
  {
    id: "F11",
    name: "Assessments and development",
    patterns: [/assessment/i, /development/i],
  },
  {
    id: "F12",
    name: "Parent contact and calls",
    patterns: [/calls?/i, /bcalls/i, /phone.contact/i],
  },
  {
    id: "F13",
    name: "Messaging",
    patterns: [/messages?/i, /msg_/i, /message_portal/i, /inbox/i],
  },
  {
    id: "F14",
    name: "Alerts and follow-up",
    patterns: [/alarms?/i, /notification/i, /reminder/i],
  },
  {
    id: "F18",
    name: "Accounting and payments",
    patterns: [/accounting/i, /invoice/i, /payments?/i, /finance/i, /ledger/i, /invo\.php/i],
  },
  {
    id: "F17",
    name: "Staff attendance and scheduling",
    patterns: [
      /employees\/attendance/i,
      /employees\/calendar/i,
      /pa_logs/i,
      /payroll/i,
      /teacher.calendar/i,
      /staff attendance/i,
      /attendance logs/i,
    ],
  },
  {
    id: "F16",
    name: "Staff lifecycle",
    patterns: [
      /employees/i,
      /teachers?/i,
      /managers?/i,
      /nurses?/i,
      /doctors?/i,
      /staff/i,
    ],
  },
  {
    id: "F15",
    name: "Food and calendars",
    patterns: [
      /food/i,
      /holiday/i,
      /events?/i,
      /notifcalendar/i,
      /calendar/i,
    ],
  },
  {
    id: "F04",
    name: "Attendance and check-in",
    patterns: [/attendance/i, /attend_det/i, /check.?in/i, /check.?out/i, /heatmap/i],
  },
  {
    id: "F07",
    name: "Child workspace",
    patterns: [
      /children\/\[id\]/i,
      /child_details/i,
      /child_dashboard/i,
      /child_(accounting|report)/i,
    ],
  },
  {
    id: "F06",
    name: "Child roster and enrollment",
    patterns: [/children/i, /child(ren)?_draft/i, /child form/i, /new child/i],
  },
  {
    id: "F05",
    name: "Branch and room operations",
    patterns: [
      /\/branches(?:\b|\/|\?|,)/i,
      /\/branch\.php/i,
      /\/admin\/branches?\.php/i,
      /branch_dashboard/i,
      /\/classes(?:\b|\/|\?|,)/i,
      /\/class\.php/i,
      /classesperbranch/i,
      /\/admin\/classes?\.php/i,
      /class_dashboard/i,
      /(^|\n)\/rooms?(?:\b|\/|\?|,)/i,
    ],
  },
  {
    id: "F03",
    name: "Today and opening readiness",
    patterns: [/\/today/i, /dashboard/i, /index\.php/i, /admin\/home/i],
  },
  {
    id: "F19",
    name: "Reports and exports",
    patterns: [/reports?/i, /exports?/i, /print/i, /tabletools/i, /pdf/i],
  },
  {
    id: "F02",
    name: "Organization context",
    patterns: [
      /organization/i,
      /school.year/i,
      /scholastic/i,
      /year database/i,
      /garderie registry/i,
      /context switch/i,
    ],
  },
  {
    id: "F21",
    name: "Administration and access",
    patterns: [
      /settings/i,
      /users?/i,
      /access.control/i,
      /levels?/i,
      /regions?/i,
      /zones?/i,
      /areas?/i,
      /newyear/i,
      /nurseryinfo/i,
      /admin panel/i,
      /actions?_control/i,
    ],
  },
  {
    id: "P00",
    name: "Cross-cutting platform and production",
    patterns: [
      /global app/i,
      /app shell/i,
      /header/i,
      /sidebar/i,
      /middleware/i,
      /proxy/i,
      /production/i,
      /migration/i,
      /database/i,
      /storage/i,
      /provider/i,
      /cron/i,
      /schema/i,
      /infrastructure/i,
      /service worker/i,
      /offline/i,
      /api\/auth/i,
      /\/classes\/(data|datavalidation|fullpdfdata|mysql)\./i,
      /forbidden\.php/i,
      /getmap\.php/i,
    ],
  },
];

function parseArgs(args: string[]) {
  let format: "json" | "markdown" = "markdown";
  let outPath: string | null = null;

  for (const arg of args) {
    if (arg === "--json") format = "json";
    if (arg === "--markdown") format = "markdown";
    if (arg.startsWith("--out=")) outPath = arg.slice("--out=".length);
  }

  return { format, outPath };
}

function rowSearchText(row: ParityRow) {
  return [row.modernRoute, row.legacyPhp, row.legacyJs]
    .filter(Boolean)
    .join("\n");
}

function classify(row: ParityRow) {
  const searchText = rowSearchText(row);
  return domainRules.find((domain) =>
    domain.patterns.some((pattern) => pattern.test(searchText)),
  );
}

const { format, outPath } = parseArgs(process.argv.slice(2));
const matrixPath = resolve("docs/page-parity-matrix.json");
const rows = JSON.parse(readFileSync(matrixPath, "utf8")) as ParityRow[];

const entries = rows.map((row, index) => {
  const domain = classify(row);
  return {
    row: index + 1,
    domainId: domain?.id ?? "UNMAPPED",
    domain: domain?.name ?? "Unmapped",
    legacyPhp: row.legacyPhp ?? "",
    modernRoute: row.modernRoute ?? "",
    status: row.status ?? "",
  };
});

const domainSummary = [...domainRules, { id: "UNMAPPED", name: "Unmapped", patterns: [] }]
  .map((domain) => ({
    id: domain.id,
    name: domain.name,
    rows: entries.filter((entry) => entry.domainId === domain.id).length,
  }))
  .filter((domain) => domain.rows > 0);

const unmapped = entries.filter((entry) => entry.domainId === "UNMAPPED");
const report = {
  source: "docs/page-parity-matrix.json",
  totalRows: rows.length,
  mappedRows: rows.length - unmapped.length,
  unmappedRows: unmapped.length,
  domains: domainSummary,
  entries,
};

const jsonReport = {
  source: report.source,
  totalRows: report.totalRows,
  mappedRows: report.mappedRows,
  unmappedRows: report.unmappedRows,
  domains: report.domains,
  entries: entries.map(({ row, domainId }) => ({ row, domainId })),
};

const markdown = [
  "# Redesign Parity Domain Ledger",
  "",
  `Generated from \`${report.source}\`.`,
  "",
  `- Total rows: ${report.totalRows}`,
  `- Mapped rows: ${report.mappedRows}`,
  `- Unmapped rows: ${report.unmappedRows}`,
  "",
  "## Domain Summary",
  "",
  "| Domain | Name | Rows |",
  "| --- | --- | ---: |",
  ...domainSummary.map((domain) => `| ${domain.id} | ${domain.name} | ${domain.rows} |`),
  "",
  "## Unmapped Rows",
  "",
  ...(unmapped.length
    ? [
        "| Row | Legacy source | Modern route | Status |",
        "| ---: | --- | --- | --- |",
        ...unmapped.map(
          (entry) =>
            `| ${entry.row} | ${entry.legacyPhp.replaceAll("|", "\\|")} | ${entry.modernRoute.replaceAll("|", "\\|")} | ${entry.status.replaceAll("|", "\\|")} |`,
        ),
      ]
    : ["All parity rows are assigned to a canonical redesign domain."]),
  "",
].join("\n");

const output = format === "json" ? `${JSON.stringify(jsonReport, null, 2)}\n` : markdown;

if (outPath) {
  writeFileSync(resolve(outPath), output);
} else {
  process.stdout.write(output);
}

if (unmapped.length > 0) process.exitCode = 2;
