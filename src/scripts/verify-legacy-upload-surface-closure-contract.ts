import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const text = {
  presignRoute: readFileSync("src/app/api/uploads/presign/route.ts", "utf8"),
  localRoute: readFileSync("src/app/api/uploads/local/route.ts", "utf8"),
  uploadClient: readFileSync("src/lib/uploads/client-upload.ts", "utf8"),
  employeeForm: readFileSync(
    "src/components/employees/employee-form-client.tsx",
    "utf8",
  ),
  employeeActions: readFileSync("src/lib/actions/employees.ts", "utf8"),
  childForm: readFileSync("src/components/children/child-form.tsx", "utf8"),
  branchForm: readFileSync("src/components/branches/branch-form.tsx", "utf8"),
  classClient: readFileSync("src/components/classes/classes-client.tsx", "utf8"),
  nurseryAttachments: readFileSync(
    "src/components/branches/compliance/ministry-attachments-section.tsx",
    "utf8",
  ),
  complianceDocuments: readFileSync(
    "src/components/branches/compliance-documents-client.tsx",
    "utf8",
  ),
  dailyReportForm: readFileSync(
    "src/components/daily-reports/daily-report-form.tsx",
    "utf8",
  ),
  absenceReportForm: readFileSync(
    "src/components/absent-reports/absence-report-form.tsx",
    "utf8",
  ),
  medicalAttachments: readFileSync(
    "src/components/medical/medical-attachments-section.tsx",
    "utf8",
  ),
  callsClient: readFileSync(
    "src/app/(app)/calls/calls-management-client.tsx",
    "utf8",
  ),
  childCallDialog: readFileSync(
    "src/app/(app)/children/[id]/calls/call-report-dialog.tsx",
    "utf8",
  ),
  childAccidentDialog: readFileSync(
    "src/app/(app)/children/[id]/accidents/accident-report-dialog.tsx",
    "utf8",
  ),
  paymentDialog: readFileSync(
    "src/app/(app)/accounting/payment-dialog.tsx",
    "utf8",
  ),
  quickPaymentDialog: readFileSync(
    "src/components/accounting/quick-payment-dialog.tsx",
    "utf8",
  ),
  profileClient: readFileSync("src/app/(app)/profile/profile-client.tsx", "utf8"),
  paymentsActions: readFileSync("src/lib/actions/payments.ts", "utf8"),
  childrenActions: readFileSync("src/lib/actions/children.ts", "utf8"),
  medicalActions: readFileSync("src/lib/actions/medical.ts", "utf8"),
  topGaps: readFileSync("docs/top-20-restoration-gaps.md", "utf8"),
  storagePipeline: readFileSync("docs/file-storage-pipeline.md", "utf8"),
};

const uploadScopes = [
  "branch",
  "class",
  "child",
  "child-document",
  "compliance-document",
  "teacher",
  "teacher-document",
  "nurse",
  "nurse-document",
  "doctor",
  "doctor-document",
  "manager",
  "manager-document",
  "profile-avatar",
  "payment-receipt",
  "daily-report",
  "absence-report",
  "form-attachment",
  "medical-form",
];

for (const scope of uploadScopes) {
  assert.match(text.presignRoute, new RegExp(`"${scope}"`));
  assert.match(text.uploadClient, new RegExp(`\\| "${scope}"`));
}

for (const expected of [
  /requireOrgSafe/,
  /verifyBranchAccess/,
  /MAX_UPLOAD_BYTES = 25 \* 1024 \* 1024/,
  /contentType\.startsWith\("image\/"\)/,
  /contentType === "application\/pdf"/,
  /scope === "compliance-document"[\s\S]*requireLegacyActionAllowed\(auth\.ctx, "Upnurseryinfo"\)/,
  /provider === "local"[\s\S]*\/api\/uploads\/local/,
  /createPresignedUploadUrl/,
  /publicUrlForObjectKey/,
]) {
  assert.match(text.presignRoute, expected);
}

for (const expected of [
  /requireOrgSafe/,
  /verifyBranchAccess/,
  /keyBelongsToBranch/,
  /uploadScopeFromKey/,
  /uploadScopeFromKey\(key\) === "compliance-document"[\s\S]*requireLegacyActionAllowed\(auth\.ctx, "Upnurseryinfo"\)/,
  /storage\.provider !== "local"/,
  /resolveLocalObjectPath/,
]) {
  assert.match(text.localRoute, expected);
}

for (const expected of [
  /fetch\("\/api\/uploads\/presign"/,
  /byteSize: params\.file\.size/,
  /ownerId: params\.ownerId/,
  /if \(!presign\.publicUrl\)/,
  /fetch\(presign\.uploadUrl/,
  /body: params\.file/,
]) {
  assert.match(text.uploadClient, expected);
}

const directRuntimeSurfaces: Array<[string, string, string]> = [
  ["branch image", text.branchForm, /scope: "branch"/.source],
  ["class image", text.classClient, /scope: "class"/.source],
  ["child photo", text.childForm, /scope: "child"/.source],
  ["child document", text.childForm, /scope: "child-document"/.source],
  ["ministry attachment", text.nurseryAttachments, /scope: "compliance-document"/.source],
  ["compliance document", text.complianceDocuments, /scope: "compliance-document"/.source],
  ["daily report attachment", text.dailyReportForm, /scope: "daily-report"/.source],
  ["absence report attachment", text.absenceReportForm, /scope: "absence-report"/.source],
  ["medical form attachment", text.medicalAttachments, /scope: "medical-form"/.source],
  ["calls listing attachment", text.callsClient, /scope: "form-attachment"/.source],
  ["child call attachment", text.childCallDialog, /scope: "form-attachment"/.source],
  ["child accident attachment", text.childAccidentDialog, /scope: "form-attachment"/.source],
  ["payment receipt", text.paymentDialog, /scope: "payment-receipt"/.source],
  ["quick payment receipt", text.quickPaymentDialog, /scope: "payment-receipt"/.source],
  ["profile avatar", text.profileClient, /scope: "profile-avatar"/.source],
];

for (const [label, source, pattern] of directRuntimeSurfaces) {
  assert.match(source, new RegExp(pattern), `${label} upload scope`);
  assert.match(source, /uploadFileWithPresign/, `${label} presign upload`);
}

for (const expected of [
  /function employeeDocumentScope\(type: EmployeeType\)[\s\S]*case "teacher":[\s\S]*return "teacher-document"/,
  /case "nurse":[\s\S]*return "nurse-document"/,
  /case "doctor":[\s\S]*return "doctor-document"/,
  /case "manager":[\s\S]*return "manager-document"/,
  /function employeePhotoScope\(type: EmployeeType\)[\s\S]*return type/,
  /scope: employeePhotoScope\(type\)/,
  /scope: employeeDocumentScope\(type\)/,
  /<FormSection title="Attachments"/,
  /Add Attachment/,
]) {
  assert.match(text.employeeForm, expected);
}

for (const expected of [
  /staffAttachmentDelegate/,
  /db\.teacherAttachment/,
  /db\.nurseAttachment/,
  /db\.doctorAttachment/,
  /db\.managerAttachment/,
  /staffAttachmentCreateData/,
  /cleanDocumentFileUrl/,
  /syncStaffAttachments/,
  /createData\.attachments/,
  /await syncStaffAttachments\(type, id, data\.documents\)/,
]) {
  assert.match(text.employeeActions, expected);
}

for (const expected of [
  /ChildAttachment/,
  /fileUrl/,
  /receiptFileUrl/,
  /FormAttachment/,
  /attachments: input\.attachments/,
  /removeAttachmentIds/,
]) {
  assert.match(
    text.childrenActions + text.paymentsActions + text.medicalActions,
    expected,
  );
}

assert.doesNotMatch(
  text.topGaps,
  /Remaining work is upload attach\/update actions for any remaining non-compliance surfaces/,
);
assert.match(
  text.topGaps,
  /Runtime upload attach\/update actions are closed across branch, class, child, staff, profile, payment, daily report, absence report, call, accident, medical form, and nursery compliance surfaces/,
);
assert.match(
  text.topGaps,
  /Remaining acceptance is production-dump media audit and URL rewrite cleanup after canonical media exports are available/,
);
assert.match(
  text.storagePipeline,
  /Runtime upload routes use `createPresignedUploadUrl\(\)` with authenticated org\/branch permission checks before UI upload placeholders are enabled/,
);

console.log("legacy upload surface closure contract assertions passed");
