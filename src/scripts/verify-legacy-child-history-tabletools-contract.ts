import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const clients = {
  absence: "src/app/(app)/children/[id]/absence/absence-client.tsx",
  accidents: "src/app/(app)/children/[id]/accidents/accidents-client.tsx",
  calls: "src/app/(app)/children/[id]/calls/calls-client.tsx",
};

const exportButton = readFileSync(
  "src/components/shared/export-button.tsx",
  "utf8",
);
const matrix = readFileSync("docs/page-parity-matrix.json", "utf8");
const matrixMarkdown = readFileSync("docs/page-parity-matrix.md", "utf8");

const routeExpectations = {
  absence: {
    legacyPhp: "child_absence.php",
    legacyJs: "child_absence.js",
    modernRoute: "/child_absence.php, /children/[id]/absence",
    status:
      "restored - legacy child absence table, preview, export, print, and deep-link bridge restored",
    keyPhrase: "Date/Reason/Absent From/To/Hospital/Dr. Name/Action/Attachment table columns",
  },
  accidents: {
    legacyPhp: "child_accident.php",
    legacyJs: "child_accident.js",
    modernRoute: "/child_accident.php, /children/[id]/accidents",
    status:
      "restored - legacy child accident table, preview, export, print, and deep-link bridge restored",
    keyPhrase:
      "Date/Time/Cause/Place/Specific Area/Cam #/First Aid/Teacher/Hospital/Treatment/Action/Attachment table columns",
  },
  calls: {
    legacyPhp: "child_calls.php",
    legacyJs: "child_calls.js",
    modernRoute: "/child_calls.php, /children/[id]/calls",
    status:
      "restored - legacy incoming/outgoing call tables, preview, export, print, edit, draft status, and deep-link bridge restored",
    keyPhrase:
      "Date/Time/Cause/Pick up or Teacher/Subject/Remarks/Action/Attachment table columns",
  },
} as const;

assert.match(exportButton, /type ExportFormat = "copy" \| "xlsx" \| "csv" \| "pdf"/);
assert.match(exportButton, /exportToClipboard/);
assert.match(exportButton, /exportToExcel/);
assert.match(exportButton, /exportToCsv/);
assert.match(exportButton, /Export as PDF/);

for (const [key, path] of Object.entries(clients)) {
  const source = readFileSync(path, "utf8");
  assert.match(source, /AttachmentPreviewDialog/);
  assert.match(source, /type AttachmentPreviewItem/);
  assert.match(source, /function previewItems/);
  assert.match(source, /setPreviewTarget\(/);
  assert.match(source, /<ExportButton/);
  assert.match(source, /data=\{exportRows\(filtered/);
  assert.match(source, /window\.print\(\)/);
  assert.match(
    matrix,
    new RegExp(`${key === "accidents" ? "child_accident" : key === "absence" ? "child_absence" : "child_calls"}\\.php[\\s\\S]*AttachmentPreviewDialog-compatible image preview`),
  );

  const expected = routeExpectations[key as keyof typeof routeExpectations];
  assert.match(
    matrix,
    new RegExp(`${expected.legacyPhp}[\\s\\S]*${expected.status.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
  );
  assert.match(
    matrixMarkdown,
    new RegExp(
      `${expected.legacyPhp} \\| Front/templates/admin/js/${expected.legacyJs} \\| ${expected.modernRoute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\| ${expected.status.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
    ),
  );
  assert.match(
    matrixMarkdown,
    new RegExp(`${expected.legacyPhp}[\\s\\S]*${expected.keyPhrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
  );
  assert.match(
    matrixMarkdown,
    new RegExp(`${expected.legacyPhp}[\\s\\S]*AttachmentPreviewDialog-compatible image preview`),
  );
  assert.match(
    matrixMarkdown,
    new RegExp(`${expected.legacyPhp}[\\s\\S]*verify-legacy-child-history-tabletools-contract\\.ts`),
  );
  assert.doesNotMatch(
    matrixMarkdown,
    new RegExp(`${expected.legacyPhp}[^\\n]*visual export audit remains`),
  );
}

console.log("legacy child history TableTools/preview contract assertions passed");
