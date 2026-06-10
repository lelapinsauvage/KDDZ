import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  matrixJson: "docs/page-parity-matrix.json",
  matrixMd: "docs/page-parity-matrix.md",
  parentApiMatrix: "docs/parent-api-contract-matrix.md",
  nativeLedger: "docs/native-acceptance-ledger.md",
  e2e: "src/scripts/verify-parent-credentialed-native-e2e.ts",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

type MatrixRow = {
  legacyPhp?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrixJson) as MatrixRow[];

function rowFor(legacyPhp: string) {
  const row = matrix.find((entry) => entry.legacyPhp === legacyPhp);
  assert.ok(row, `${legacyPhp} row should exist`);
  return row;
}

const directMessageRow = rowFor("Front/templates/admin/message_portal_single.php");
assert.match(
  directMessageRow.status ?? "",
  /credentialed native route-handler acceptance restored/,
);
assert.doesNotMatch(
  directMessageRow.status ?? "",
  /credentialed native acceptance remains/,
);
assert.match(directMessageRow.verification ?? "", /\/ws\/sendMessage\.php/);
assert.match(directMessageRow.verification ?? "", /\/ws\/messagesList\.php/);
assert.match(directMessageRow.verification ?? "", /\/ws\/message\.php/);
assert.match(directMessageRow.verification ?? "", /parent-to-admin thread/);
assert.match(directMessageRow.verification ?? "", /real native-device acceptance/);
assert.doesNotMatch(
  directMessageRow.verification ?? "",
  /Remaining work is credentialed native acceptance/,
);

const parentLoginRow = rowFor("Legacy parent mobile login / ws/login.php");
assert.match(parentLoginRow.verification ?? "", /broader credentialed route-handler E2E/);
assert.match(parentLoginRow.verification ?? "", /daily\/newdaily/);
assert.match(parentLoginRow.verification ?? "", /message list\/open\/send\/reply/);
assert.match(parentLoginRow.verification ?? "", /exact native-app visual audit/);
assert.doesNotMatch(
  parentLoginRow.verification ?? "",
  /broader endpoint\/native-device E2E/,
);

assert.match(text.matrixMd, /credentialed native route-handler acceptance restored/);
assert.doesNotMatch(text.matrixMd, /credentialed native acceptance remains/);
assert.doesNotMatch(text.matrixMd, /broader endpoint\/native-device E2E/);

assert.match(text.parentApiMatrix, /docs\/native-acceptance-ledger\.md/);
assert.match(text.nativeLedger, /Local Credentialed Route-Handler E2E/);
assert.match(text.nativeLedger, /This is not an iOS Simulator/);
assert.match(text.nativeLedger, /Remaining native acceptance gates/);

assert.match(text.e2e, /verifyTemporaryMessageThread/);
assert.match(text.e2e, /ws\/sendMessage\.php/);
assert.match(text.e2e, /ws\/messagesList\.php/);
assert.match(text.e2e, /ws\/message\.php/);
assert.match(text.e2e, /verifyTemporaryPushToken/);

console.log("parent native acceptance boundary contract assertions passed");
