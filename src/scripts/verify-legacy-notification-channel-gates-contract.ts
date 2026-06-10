import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyToggle:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/classes/ajaxtoggle.php",
  legacyControl:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/page/emails-control.php",
  actions: "src/lib/actions/notification-templates.ts",
  gates: "src/lib/legacy-notification-gates.ts",
  client:
    "src/app/(app)/settings/notifications/notification-settings-client.tsx",
  birthdayJob: "src/lib/jobs/birthday-alarms.ts",
  assessmentJob: "src/lib/jobs/assessment-alarms.ts",
  medicalJob: "src/lib/jobs/medical-alarms.ts",
  medicineJob: "src/lib/jobs/medicine-alarms.ts",
  insuranceJob: "src/lib/jobs/insurance-alarms.ts",
  vaccinationJob: "src/lib/jobs/vaccination-alarms.ts",
  paymentJob: "src/lib/jobs/payment-alarms.ts",
  eventJob: "src/lib/jobs/event-alarms.ts",
  holidayJob: "src/lib/jobs/holiday-alarms.ts",
  matrix: "docs/page-parity-matrix.json",
  matrixMd: "docs/page-parity-matrix.md",
};

const contents = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(contents.legacyToggle, /\$_POST\['toggle'\]/);
assert.match(contents.legacyToggle, /\$_POST\['col'\]/);
assert.match(contents.legacyToggle, /\$_POST\['id'\]/);
assert.match(contents.legacyToggle, /UPDATE t_notification_setting SET \$col = \$toggle WHERE id = \$id/);
assert.match(contents.legacyControl, /Notifications\/Alerts Control/);
for (const label of ["System Alerts", "Emails", "Whatsapp", "SMS"]) {
  assert.match(contents.legacyControl, new RegExp(label));
}
for (const column of ["alarms", "email", "whatsapp", "sms"]) {
  assert.match(contents.legacyControl, new RegExp(`${column}-<\\?php echo \\$nrow\\['id'\\]; \\?>`));
  assert.match(contents.legacyControl, new RegExp(`\\$nrow\\['${column}'\\] == -1\\) echo 'disabled'`));
}
assert.match(contents.legacyControl, /url: "classes\/ajaxtoggle\.php"/);

assert.match(contents.actions, /type LegacyNotificationChannel = "alarms" \| "email" \| "whatsapp" \| "sms"/);
assert.match(contents.actions, /export async function updateLegacyNotificationChannelSetting/);
assert.match(contents.actions, /Unknown notification channel/);
assert.match(contents.actions, /setting\.legacyTable !== "t_notification_setting"/);
assert.match(contents.actions, /legacyMtypeChannel\(currentData\) === channel/);
assert.match(contents.actions, /targetKey = "status"/);
assert.match(contents.actions, /Legacy channel is not present on this row/);
assert.match(contents.actions, /currentValue === -1/);
assert.match(contents.actions, /Legacy channel is locked for this row/);
assert.match(contents.actions, /legacyData: nextData as Prisma\.InputJsonValue/);
assert.match(contents.actions, /settingValue: JSON\.stringify\(nextData\)/);
assert.match(contents.actions, /revalidatePath\("\/settings\/notifications"\)/);

for (const channel of ["System Alerts", "Emails", "Whatsapp", "SMS"]) {
  assert.match(contents.client, new RegExp(`label: "${channel}"`));
}
assert.match(contents.client, /legacyMtypeChannel\(data\) !== channel/);
assert.match(contents.client, /setting\.legacyTable === "t_notification_setting"/);
assert.match(contents.client, /LEGACY_CHANNELS\.some/);
assert.match(contents.client, /updateLegacyNotificationChannelSetting\(/);
assert.match(contents.client, /Legacy channel updated\./);
assert.match(contents.client, /Legacy channel update failed\./);

assert.match(contents.gates, /export type LegacyNotificationGateKey =/);
for (const key of [
  "medicine",
  "birthdays",
  "general",
  "events",
  "insurance",
  "vaccinations",
  "assessments",
  "medical",
  "payments",
]) {
  assert.match(contents.gates, new RegExp(`${key}: true`));
}
assert.match(contents.gates, /LEGACY_NOTIFICATION_GATE_INDEX/);
assert.match(contents.gates, /legacyAlarmSettingEnabled/);
assert.match(contents.gates, /record\.alarms \?\? record\.status \?\? row\.settingValue/);
assert.match(contents.gates, /chooseLegacyNotificationRows/);
assert.match(contents.gates, /legacyTable: "t_notification_setting"/);
assert.match(contents.gates, /export async function isLegacyNotificationGateEnabled/);

const jobExpectations: Array<[keyof typeof files, string]> = [
  ["birthdayJob", "birthdays"],
  ["assessmentJob", "assessments"],
  ["medicalJob", "medical"],
  ["medicineJob", "medicine"],
  ["insuranceJob", "insurance"],
  ["vaccinationJob", "vaccinations"],
  ["paymentJob", "payments"],
  ["eventJob", "events"],
  ["holidayJob", "events"],
];

for (const [fileKey, gate] of jobExpectations) {
  const source = contents[fileKey];
  assert.match(source, /isLegacyNotificationGateEnabled/);
  assert.match(source, new RegExp(`organizationId, "${gate}"`));
}

assert.match(
  contents.matrix,
  /ajaxtoggle\.php[\s\S]*restored - legacy ajax channel toggles and alarm-generator enforcement restored/,
);
assert.match(
  contents.matrix,
  /emails-control\.php[\s\S]*restored - legacy notification channel matrix and alarm gates restored/,
);
assert.match(contents.matrix, /verify-legacy-notification-channel-gates-contract\.ts/);
assert.doesNotMatch(
  contents.matrix,
  /ajaxtoggle\.php[\s\S]*Remaining work is enforcing recovered external email/,
);
assert.doesNotMatch(
  contents.matrix,
  /emails-control\.php[\s\S]*external providers remain/,
);

assert.match(
  contents.matrixMd,
  /Front\/templates\/admin\/users\/admin\/classes\/ajaxtoggle\.php \|  \| \/settings\/notifications \| restored - legacy ajax channel toggles and alarm-generator enforcement restored/,
);
assert.match(
  contents.matrixMd,
  /Front\/templates\/admin\/users\/admin\/page\/emails-control\.php \|  \| \/settings\/notifications \| restored - legacy notification channel matrix and alarm gates restored/,
);

console.log("legacy notification channel gates contract assertions passed");
