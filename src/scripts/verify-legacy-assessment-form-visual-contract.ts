import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";

const legacyTypes = [1, 2, 3, 4, 5, 6, 7] as const;
const ageTitles: Record<number, string> = {
  1: "1 - 3 months",
  2: "4 - 7 months",
  3: "8 - 12 months",
  4: "12 - 24 months",
  5: "24 - 36 months",
  6: "3 - 4 years",
  7: "4 - 5 years",
};

const text = {
  form: readFileSync("src/components/assessments/assessment-form.tsx", "utf8"),
  newPage: readFileSync("src/app/(app)/assessments/[type]/new/page.tsx", "utf8"),
  editPage: readFileSync("src/app/(app)/assessments/[type]/[id]/page.tsx", "utf8"),
  types: readFileSync("src/lib/assessment-types.ts", "utf8"),
  actions: readFileSync("src/lib/actions/assessments.ts", "utf8"),
  resolver: readFileSync("src/lib/legacy-assessment.ts", "utf8"),
  childResolver: readFileSync("src/lib/legacy-child.ts", "utf8"),
  guards: readFileSync("src/lib/legacy-page-guards.ts", "utf8"),
  matrixJson: readFileSync("docs/page-parity-matrix.json", "utf8"),
  matrixMd: readFileSync("docs/page-parity-matrix.md", "utf8"),
};

function assertIncludes(source: string, tokens: string[], label: string) {
  for (const token of tokens) {
    assert.ok(source.includes(token), `${label}: ${token}`);
  }
}

for (const type of legacyTypes) {
  const php = readFileSync(
    `${legacyRoot}/Front/templates/admin/assessment_${type}.php`,
    "utf8",
  );
  const js = readFileSync(
    `${legacyRoot}/Front/templates/admin/js/assessment_${type}.js`,
    "utf8",
  );
  const bridge = readFileSync(
    `src/app/(app)/assessment_${type}.php/page.tsx`,
    "utf8",
  );

  assert.match(php, /Check::protectPageOrFunction\('assessment\.php'\)/);
  assert.match(php, /<title>Development report<\/title>/);
  assert.match(php, /id="emp_id"/);
  assert.match(php, /id="form_id"/);
  assert.match(php, /id="is_draft"/);
  assert.match(php, /Development report/);
  assert.match(php, new RegExp(ageTitles[type].replaceAll(" ", "\\s*")));
  assert.match(php, /green\.jpg[\s\S]*Form Filled Completely/);
  assert.match(php, /red\.jpg[\s\S]*Form Not Filled Completely/);
  assert.match(php, /id="IdImageUpload" src="\.\/images\/EmpPhoto\/default\.jpg"/);
  assert.match(php, /id="ddate"/);
  assert.match(php, /id="comments"/);
  assert.match(php, /btnUpdate/);
  assert.match(php, /btnDraft/);
  assert.match(php, new RegExp(`<script src="js/assessment_${type}\\.js"`));

  assert.match(js, /function Create\(ac_no, formid, isrepdraft,update\)/);
  assert.match(js, /Save As Draft|btnDraft/);
  assert.match(js, /formdata\.append\('is_draft', is_draft\)/);
  assert.match(js, /formdata\.append\('child_id', ac_no\)/);
  assert.match(js, /formdata\.append\('ddate', ddate\)/);
  assert.match(js, /formdata\.append\('comments', comments\)/);
  assert.match(js, /getcheckboxesassess|getFormAssessment|isAssessment/);
  assert.match(js, /Same Report Already Submitted for this Child! Max \d+ reports?/);
  assert.match(js, /Please Fill Red Boxes!/);

  assert.match(bridge, new RegExp(`resolveLegacyAssessmentId\\(${type}, fid\\)`));
  assert.ok(
    bridge.includes(
      `redirect(\`/assessments/${type}/\${encodeURIComponent(assessmentId)}\`)`,
    ),
  );
  assert.match(bridge, /resolveLegacyChildId\(id\)/);
  assert.ok(
    bridge.includes(
      `redirect(\`/assessments/${type}/new?childId=\${encodeURIComponent(childId)}\`)`,
    ),
  );
  assert.match(bridge, new RegExp(`redirect\\("/assessments/${type}"\\)`));
}

assert.match(text.resolver, /export async function resolveLegacyAssessmentId/);
assert.match(text.resolver, /assessmentType,/);
assert.match(text.resolver, /UUID_PATTERN\.test\(normalizedIdentifier\)/);
assert.match(text.resolver, /legacyId: \{ in: legacyIds \}/);
assert.match(text.resolver, /legacyKey: normalizedIdentifier/);
assert.match(text.resolver, /child: \{ branch: \{ organizationId \} \}/);

assert.match(text.guards, /legacyPage: "assessment\.php"/);
for (const type of legacyTypes) {
  assert.match(text.guards, new RegExp(`"/assessment_${type}\\.php"`));
}

assertIncludes(
  text.form,
  [
    "ASSESSMENT_CONFIGS",
    "ASSESSMENT_TYPE_NAMES",
    "Child *",
    "Select a child...",
    "Status",
    "Draft",
    "Submitted",
    "Reviewed",
    "evaluated",
    "red flag",
    "Developmental Red Flags",
    "Critical for Ministry",
    "Yes",
    "No",
    "Comments",
    "Additional notes or observations...",
    "Save as Draft",
    "Submit Assessment",
    "Cancel",
  ],
  "modern assessment form",
);
assert.match(text.form, /ALL_BRACKETS = \[/);
assert.match(text.form, /\{ idx: 1, label: "0-3 mos", type: 1 \}/);
assert.match(text.form, /\{ idx: 7, label: "4-5 yrs", type: 7 \}/);
assert.match(text.form, /createAssessment\(/);
assert.match(text.form, /updateAssessment\(/);
assert.match(text.form, /router\.push\(`\/assessments\/\$\{activeType\}`\)/);

assert.match(text.newPage, /getChildren\(\{ status: "ACTIVE", pageSize: "all" \}\)/);
assert.match(text.newPage, /defaultValues=\{childId \? \{ childId \} : undefined\}/);
assert.match(text.editPage, /getAssessment\(id\)/);
assert.match(text.editPage, /getChildren\(\{ status: "ACTIVE", pageSize: "all" \}\)/);
assert.match(text.editPage, /status: assessment\.status as "DRAFT" \| "SUBMITTED" \| "REVIEWED"/);

for (const type of legacyTypes) {
  assert.match(text.types, new RegExp(`${type}: "[^"]+"`));
  assert.match(text.types, new RegExp(`type: ${type}`));
}

assert.match(text.actions, /function shouldPublishNewAssessmentMarker/);
assert.match(text.actions, /legacyAssessmentReportId/);
assert.match(text.actions, /_legacyNewAssessmentMarkers/);
assert.match(text.actions, /createAssessment/);
assert.match(text.actions, /updateAssessment/);
assert.match(text.actions, /deleteAssessment/);

const matrix = JSON.parse(text.matrixJson) as Array<{
  legacyPhp: string;
  modernRoute: string;
  status: string;
  verification: string;
}>;
for (const type of legacyTypes) {
  const row = matrix.find(
    (entry) => entry.legacyPhp === `Front/templates/admin/assessment_${type}.php`,
  );
  assert.ok(row, `assessment_${type}.php matrix row should exist`);
  assert.equal(
    row.status,
    "restored - report review queue, legacy bridge, and shared form visual audit restored",
  );
  assert.equal(
    row.modernRoute,
    `/assessment_${type}.php, /assessments/${type}, /assessments/${type}/new, /assessments/${type}/[id]`,
  );
  assert.match(row.verification, new RegExp(`/assessment_${type}\\.php`));
  assert.match(row.verification, /Browser smoke confirmed/);
  assert.match(row.verification, /Development report form/);
  assert.match(row.verification, /Child selector/);
  assert.match(row.verification, /Status/);
  assert.match(row.verification, /Yes\/No criteria/);
  assert.match(row.verification, /Developmental Red Flags/);
  assert.match(row.verification, /Save as Draft/);
  assert.match(row.verification, /Submit Assessment/);
  assert.match(row.verification, /no broken images/);
  assert.match(row.verification, /existing Radix hydration-id warning/);
}

for (const type of legacyTypes) {
  const markdownRow =
    text.matrixMd
      .split("\n")
      .find((line) =>
        line.includes(`| Front/templates/admin/assessment_${type}.php |`),
      ) ?? "";
  assert.match(markdownRow, /legacy bridge, and shared form visual audit restored/);
  assert.doesNotMatch(markdownRow, /visual audit remains/);
  assert.match(markdownRow, new RegExp(`/assessment_${type}\\.php`));
}

console.log("legacy assessment form visual contract verified");
