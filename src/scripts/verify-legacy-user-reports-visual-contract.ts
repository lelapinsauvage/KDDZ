import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";

const text = {
  legacyClass: readFileSync(
    `${legacyRoot}/Front/templates/admin/users/admin/classes/reports.class.php`,
    "utf8",
  ),
  legacyPage: readFileSync(
    `${legacyRoot}/Front/templates/admin/users/admin/page/reports.php`,
    "utf8",
  ),
  bridge: readFileSync(
    "src/app/(app)/users/admin/page/reports.php/page.tsx",
    "utf8",
  ),
  page: readFileSync(
    "src/app/(app)/settings/legacy-users/reports/page.tsx",
    "utf8",
  ),
  client: readFileSync(
    "src/app/(app)/settings/legacy-users/reports/legacy-auth-reports-client.tsx",
    "utf8",
  ),
  actions: readFileSync("src/lib/actions/legacy-auth-reports.ts", "utf8"),
  matrixJson: readFileSync("docs/page-parity-matrix.json", "utf8"),
  matrixMd: readFileSync("docs/page-parity-matrix.md", "utf8"),
};

function assertIncludes(source: string, tokens: string[], label: string) {
  for (const token of tokens) {
    assert.ok(source.includes(token), `${label}: ${token}`);
  }
}

assert.match(text.legacyClass, /public \$socialMethods = array\(/);
assert.match(text.legacyClass, /'integration-'\.\$method\.'-enable'/);
assert.match(text.legacyClass, /SELECT `timestamp` FROM `login_users`/);
assert.match(text.legacyClass, /FROM `login_integration`/);
assert.match(text.legacyClass, /COUNT\( login_timestamps\.user_id \) AS counted_logins/);
assert.match(text.legacyClass, /ORDER BY counted_logins DESC/);
assert.match(text.legacyClass, /LIMIT 0,10/);
assert.match(text.legacyClass, /countRegisteredUsers/);
assert.match(text.legacyClass, /countSocialUsers/);

assertIncludes(
  text.legacyPage,
  [
    "Registered Users",
    'id="reports-date-form"',
    'name="start_date"',
    'name="end_date"',
    "Total",
    "Range",
    'id="choices"',
    "<strong>Tip:</strong> Hover over the points on the graph!",
    'id="registeredUsersGraph"',
    "Most Frequent Users",
    "Top 10",
    "Username",
    "Logins",
    'id="topUsers"',
    "plotAccordingToChoices",
    "$.plot($(\"#registeredUsersGraph\")",
    "$.plot($(\"#topUsers\")",
  ],
  "legacy reports page",
);

assert.match(text.bridge, /redirect\("\/settings\/legacy-users\/reports"\)/);
assert.match(text.page, /await requireLegacyAdminPanelAccess\(\)/);
assert.match(text.page, /getLegacyAuthReports\(\{/);
assert.match(text.page, /groupKey: firstParam\(params\.group\)/);
assert.match(text.page, /startDate: firstParam\(params\.startDate\)/);
assert.match(text.page, /endDate: firstParam\(params\.endDate\)/);

assert.match(text.actions, /LegacyAuthReportProvider/);
assert.match(text.actions, /facebook[\s\S]*twitter[\s\S]*google[\s\S]*yahoo/);
assert.match(text.actions, /integration-\$\{provider\.key\}-enable/);
assert.match(text.actions, /recordType: "social_integration"/);
assert.match(text.actions, /registeredAt\(user\)/);
assert.match(text.actions, /point\.newUsers \+= 1/);
assert.match(text.actions, /point\[provider\.key\] \+= 1/);
assert.match(text.actions, /legacyLoginTimestamp\.findMany/);
assert.match(text.actions, /\.sort\(\(a, b\) => b\.loginCount - a\.loginCount/);
assert.match(text.actions, /\.slice\(0, 10\)/);

assertIncludes(
  text.client,
  [
    "Legacy Reports",
    "Registered users, social sign-ins, and login frequency from the legacy PHP login admin",
    "Source",
    "From",
    "To",
    "Submit",
    "Total",
    "Range",
    "Timestamp rows",
    "Registered Users",
    "seriesChoices",
    "Checkbox",
    "Toggle ${choice.label}",
    "Tip: Hover over the points on the graph.",
    "New users",
    "Most Frequent Users",
    "Top 10",
    "Username",
    "Logins",
    "No login timestamps found.",
  ],
  "modern reports client",
);
assert.match(text.client, /isSeriesVisible\("newUsers"\)/);
assert.match(text.client, /data\.providers\s*\n\s*\.filter\(\(provider\) => isSeriesVisible\(provider\.key\)\)/);
assert.match(text.client, /<LineChart data=\{data\.series\}>/);
assert.match(text.client, /<BarChart data=\{topUserChartData\}>/);

const matrix = JSON.parse(text.matrixJson) as Array<{
  legacyPhp: string;
  modernRoute: string;
  status: string;
  verification: string;
}>;

const classRow = matrix.find(
  (entry) =>
    entry.legacyPhp ===
    "Front/templates/admin/users/admin/classes/reports.class.php",
);
assert.ok(classRow, "reports.class.php matrix row should exist");
assert.equal(classRow.modernRoute, "/settings/legacy-users/reports");
assert.equal(
  classRow.status,
  "restored - legacy registration reports, series controls, Top 10 login table, bridge, and browser visual audit restored",
);

const pageRow = matrix.find(
  (entry) =>
    entry.legacyPhp === "Front/templates/admin/users/admin/page/reports.php",
);
assert.ok(pageRow, "page/reports.php matrix row should exist");
assert.equal(
  pageRow.modernRoute,
  "/users/admin/page/reports.php, /settings/legacy-users/reports",
);
assert.equal(
  pageRow.status,
  "restored - legacy reports page bridge, Registered Users chart controls, Top 10 login table, and browser visual audit restored",
);

for (const row of [classRow, pageRow]) {
  assert.match(row.verification, /Registered Users/);
  assert.match(row.verification, /From\/To date range/);
  assert.match(row.verification, /Total and Range registered counts/);
  assert.match(row.verification, /enabled social-provider totals/);
  assert.match(row.verification, /series checkboxes/);
  assert.match(row.verification, /Tip: Hover over the points on the graph/);
  assert.match(row.verification, /Most Frequent Users/);
  assert.match(row.verification, /Top 10/);
  assert.match(row.verification, /Username\/Logins/);
  assert.match(row.verification, /Browser smoke confirmed/);
  assert.match(
    row.verification,
    /src\/scripts\/verify-legacy-user-reports-visual-contract\.ts/,
  );
}

const classMarkdownRow =
  text.matrixMd
    .split("\n")
    .find((line) =>
      line.includes(
        "| Front/templates/admin/users/admin/classes/reports.class.php |",
      ),
    ) ?? "";
const pageMarkdownRow =
  text.matrixMd
    .split("\n")
    .find((line) =>
      line.includes("| Front/templates/admin/users/admin/page/reports.php |"),
    ) ?? "";

assert.match(classMarkdownRow, /browser visual audit restored/);
assert.match(pageMarkdownRow, /browser visual audit restored/);
assert.doesNotMatch(classMarkdownRow, /visual parity remains/);
assert.doesNotMatch(pageMarkdownRow, /AJAX fade\/Flot UI behavior/);

console.log("Legacy user reports visual contract verified.");
