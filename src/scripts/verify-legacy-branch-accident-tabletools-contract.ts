import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/Medical_forms5b.js",
  legacyPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/Medical_forms5b.php",
  redirect: "src/app/(app)/Medical_forms5b.php/route.ts",
  page: "src/app/(app)/medical/accidents/page.tsx",
  client: "src/app/(app)/medical/accidents/accident-reports-client.tsx",
  legacyBranch: "src/lib/legacy-branch.ts",
  exportButton: "src/components/shared/export-button.tsx",
  matrix: "docs/page-parity-matrix.json",
  matrixMd: "docs/page-parity-matrix.md",
};

const contents = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(contents.legacyPhp, /encrypt_decrypt\('decrypt'/);
assert.match(contents.legacyPhp, /window\.location = 'Medical_forms5\.php'/);
assert.match(contents.legacyPhp, /<title>Accident Reports - <\?php echo \$branchname; \?>/);
assert.match(contents.legacyPhp, /id="branchid" value="<\?php echo \$brid; \?>"/);
assert.match(contents.legacyPhp, /Medical_forms5b\.js/);

assert.match(contents.legacyJs, /var brid = \$\('#branchid'\)\.val\(\)/);
assert.match(contents.legacyJs, /"lengthMenu":\s*\[\s*\[\s*10,\s*20,\s*50,\s*100,\s*150,\s*-1\s*\]/);
assert.match(contents.legacyJs, /"pageLength":\s*10/);
assert.match(contents.legacyJs, /"oTableTools"/);
assert.match(contents.legacyJs, /"copy"/);
assert.match(contents.legacyJs, /"print"/);
assert.match(contents.legacyJs, /'sExtends':\s*'pdf'/);
assert.match(contents.legacyJs, /'sExtends':\s*'xls'/);
assert.match(contents.legacyJs, /"url":\s*"\.\.\/\.\.\/\.\.\/ajax\/v1\/getformfiveAllperbranch"/);
assert.match(contents.legacyJs, /brid:\s*brid/);
assert.match(contents.legacyJs, /\[0,\s*"desc"\]/);

assert.match(contents.legacyBranch, /legacyNumericCandidates\(identifier\)/);
assert.match(contents.legacyBranch, /UUID_PATTERN\.test\(normalizedIdentifier\)/);
assert.match(contents.legacyBranch, /legacyId:\s*\{\s*in:\s*legacyIds\s*\}/);

assert.match(contents.redirect, /export const runtime = "nodejs"/);
assert.match(contents.redirect, /NextResponse\.redirect\(new URL\("\/medical\/accidents", request\.url\)\)/);
assert.match(contents.redirect, /resolveLegacyBranchId\(brid\)/);
assert.match(contents.redirect, /target\.searchParams\.set\("branch", branchId\)/);
assert.match(contents.redirect, /NextResponse\.redirect\(target\)/);

assert.match(contents.page, /searchParams: Promise<\{ branch\?: string \}>/);
assert.match(contents.page, /branches\.find\(\(branch\) => branch\.id === requestedBranchId\)/);
assert.match(contents.page, /formType:\s*"ACCIDENTS"/);
assert.match(contents.page, /pageSize:\s*"all"/);
assert.match(contents.page, /branchId:\s*scopedBranch\?\.id/);
assert.match(contents.page, /initialBranchId=\{scopedBranch\?\.id\}/);
assert.match(contents.page, /branchScoped=\{Boolean\(scopedBranch\)\}/);

assert.match(contents.exportButton, /type ExportFormat = "copy" \| "xlsx" \| "csv" \| "pdf"/);
assert.match(contents.exportButton, /Copy table/);
assert.match(contents.exportButton, /Export as Excel \(\.xlsx\)/);
assert.match(contents.exportButton, /Export as CSV \(\.csv\)/);
assert.match(contents.exportButton, /Export as PDF \(\.pdf\)/);

assert.match(contents.client, /const PAGE_SIZES = \["10", "20", "50", "100", "150", "ALL"\]/);
assert.match(contents.client, /const accidentReportsExportColumns/);
assert.match(contents.client, /header: "Form #"/);
assert.match(contents.client, /header: "First Aid"/);
assert.match(contents.client, /const lockedBranchId = branchScoped && initialBranchId \? initialBranchId : null/);
assert.match(contents.client, /const pageTitle = scopedBranchName \? `Accident Reports - \$\{scopedBranchName\}` : "Accident Reports"/);
assert.match(contents.client, /disabled=\{Boolean\(lockedBranchId\)\}/);
assert.match(contents.client, /<ExportButton/);
assert.match(contents.client, /filename="accident-reports"/);
assert.match(contents.client, /sheetName="Accident Reports Listing"/);
assert.match(contents.client, /columns=\{accidentReportsExportColumns\}/);
assert.match(contents.client, /data=\{filteredReports as unknown as Record<string, unknown>\[\]\}/);
assert.match(contents.client, /window\.print\(\)/);
assert.match(contents.client, /\[0,\s*"desc"\]|rightId - leftId/);

assert.match(
  contents.matrix,
  /Medical_forms5b\.php[\s\S]*restored - legacy branch accident report bridge, locked listing, TableTools export, and print restored/,
);
assert.match(
  contents.matrix,
  /Medical_forms5b\.php[\s\S]*Copy\/PDF\/Excel\/CSV export and print action/,
);
assert.match(
  contents.matrix,
  /Medical_forms5b\.php[\s\S]*verify-legacy-branch-accident-tabletools-contract\.ts/,
);

assert.match(
  contents.matrixMd,
  /Medical_forms5b\.php \| Front\/templates\/admin\/js\/Medical_forms5b\.js \| \/Medical_forms5b\.php, \/medical\/accidents\?branch= \| restored - legacy branch accident report bridge, locked listing, TableTools export, and print restored/,
);
assert.match(
  contents.matrixMd,
  /Medical_forms5b\.php[\s\S]*Copy\/PDF\/Excel\/CSV export and print action/,
);
assert.match(
  contents.matrixMd,
  /Medical_forms5b\.php[\s\S]*verify-legacy-branch-accident-tabletools-contract\.ts/,
);
assert.doesNotMatch(
  contents.matrixMd,
  /Medical_forms5b\.php[^\n]*visual export audit remains/,
);

console.log("legacy branch accident TableTools contract assertions passed");
