import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(isAbsolute(path) ? path : join(root, path), "utf8");
}

const text = {
  legacyFormPhp: read("/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/absentreport.php"),
  legacyReportsPhp: read("/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/absentreports.php"),
  legacyDraftsPhp: read("/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/absentreportsD.php"),
  reportsClient: read("src/app/(app)/absent-reports/absent-reports-client.tsx"),
  formClient: read("src/components/absent-reports/absence-report-form.tsx"),
  reportsBridge: read("src/app/(app)/absentreports.php/page.tsx"),
  draftsBridge: read("src/app/(app)/absentreportsD.php/page.tsx"),
  formBridge: read("src/app/(app)/absentreport.php/page.tsx"),
  parityMatrix: read("docs/page-parity-matrix.md"),
};

for (const expected of [
  /Absent Reports Listing/,
  /F Name/,
  /L Name/,
  /Report Date/,
]) {
  assert.match(text.legacyReportsPhp, expected);
  assert.match(text.reportsClient, expected);
}

assert.match(text.legacyReportsPhp, /fa fa-slack/);
assert.match(text.reportsClient, /Child #/);

assert.match(text.legacyDraftsPhp, /Absent Drafts|Draft/);
assert.match(text.reportsClient, /variant === "drafts"/);
assert.match(text.reportsClient, /Report #/);
assert.match(text.reportsClient, /ExportButton/);
assert.match(text.reportsClient, /Printer/);
assert.match(text.reportsClient, /PAGE_SIZES = \["10", "20", "50", "100", "150", "ALL"\]/);

for (const expected of [
  /Save As Draft/,
  /Save Absent Report/,
  /Does the Child attend Hospital\?/,
  /hospitalName/,
  /doctorName/,
  /Add New Attachments/,
  /Drop files here or add an attachment/,
]) {
  assert.match(text.formClient, expected);
}

assert.match(text.legacyFormPhp, /btnDraft|Save As Draft/);
assert.match(text.legacyFormPhp, /attend_hos|hos_name|dr_name/);

assert.match(text.reportsBridge, /redirect\("\/absent-reports"\)/);
assert.match(text.draftsBridge, /redirect\("\/absent-reports\/drafts"\)/);
assert.match(text.formBridge, /resolveLegacyAbsenceReportId/);
assert.match(text.formBridge, /resolveLegacyChildId/);
assert.match(text.formBridge, /findAbsenceReportForChildDate/);
assert.match(text.formBridge, /\/absent-reports\/new\?/);

for (const legacyPhp of [
  "Front/templates/admin/absentreport.php",
  "Front/templates/admin/absentreports.php",
  "Front/templates/admin/absentreportsD.php",
]) {
  const row = text.parityMatrix
    .split("\n")
    .find((line) => line.includes(`| ${legacyPhp} |`));
  assert.ok(row, `${legacyPhp} parity row should exist`);
  assert.doesNotMatch(
    row,
    /Remaining work is final logged-in visual smoke/,
    `${legacyPhp} parity row should no longer be blocked on local visual smoke`,
  );
}

console.log("legacy absence visual smoke contract assertions passed");
