import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";

const files = {
  legacyPhp: `${legacyRoot}/Front/templates/admin/branch.php`,
  legacyJs: `${legacyRoot}/Front/templates/admin/js/branch.js`,
  bridge: "src/app/(app)/branch.php/page.tsx",
  newPage: "src/app/(app)/branches/new/page.tsx",
  editPage: "src/app/(app)/branches/[id]/edit/page.tsx",
  form: "src/components/branches/branch-form.tsx",
  validation: "src/lib/validations/branch.ts",
  actions: "src/lib/actions/branches.ts",
  actionPermissions: "src/lib/legacy-branch-action-permissions.ts",
  guardMap: "src/lib/legacy-page-guards.ts",
  migration: "src/scripts/migration/migrate-branches.ts",
  fileRules: "docs/legacy-file-storage-rules.md",
  matrix: "docs/page-parity-matrix.json",
  matrixMd: "docs/page-parity-matrix.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyPhp, /Check::protectPageOrFunction\('branches\.php'\)/);
assert.match(text.legacyPhp, /<title>Branch Form<\/title>/);
assert.match(text.legacyPhp, /id="emp_id"/);
assert.match(text.legacyPhp, /id="IdImageUpload" src="\.\/images\/BranchPhoto\/default\.jpg"/);
assert.match(text.legacyPhp, /id="ProfileImage" accept="image\/\*"/);
assert.match(text.legacyPhp, /Branch Info\./);
assert.match(text.legacyPhp, /Branch Name:[\s\S]*id="brname"/);
assert.match(text.legacyPhp, /Branch Location:[\s\S]*id="brlocation"/);
assert.match(text.legacyPhp, /Branch Prefix:[\s\S]*id="prefix"/);
assert.match(text.legacyPhp, /id="phone"/);
assert.match(text.legacyPhp, /id="tel"/);

for (const token of [
  "function Create()",
  "function Update(ac_no)",
  "Please Fill the mendatory Fields (RED) !!",
  "formdata.append('image'",
  "formdata.append('brname', brname)",
  "formdata.append('brlocation', brlocation)",
  "formdata.append('phone', phone)",
  "formdata.append('tel', tel)",
  "formdata.append('prefix', prefix)",
  "formdata.append('branch_id', ac_no)",
  "url: '../../../ajax/v1/AddBranch'",
  "url: '../../../ajax/v1/UpdateBranch'",
  "Branch has been created",
  "Branch has been Updated",
  "readURL(input)",
  "$('.profile_image').attr('src', e.target.result)",
]) {
  assert.match(text.legacyJs, new RegExp(escapeRegExp(token)));
}

assert.match(text.bridge, /getLegacyBranchActionPermissions\(ctx\)/);
assert.match(text.bridge, /if \(!id\?\.trim\(\)\)/);
assert.match(text.bridge, /permissions\.canAddBranch/);
assert.match(text.bridge, /permissions\.canUpdateBranch/);
assert.match(text.bridge, /resolveLegacyBranchId\(id\)/);
assert.match(text.bridge, /redirect\("\/branches\/new"\)/);
assert.match(text.bridge, /redirect\(`\/branches\/\$\{encodeURIComponent\(branchId\)\}\/edit`\)/);

assert.match(text.newPage, /getLegacyBranchActionPermissions\(ctx\)/);
assert.match(text.newPage, /permissions\.canAddBranch/);
assert.match(text.newPage, /redirect\("\/forbidden\.php"\)/);
assert.match(text.newPage, /<BranchForm \/>/);

assert.match(text.editPage, /getLegacyBranchActionPermissions\(ctx\)/);
assert.match(text.editPage, /permissions\.canUpdateBranch/);
assert.match(text.editPage, /getBranch\(id\)/);
assert.match(text.editPage, /<BranchForm[\s\S]*hideHeader[\s\S]*branch=\{\{/);
assert.match(text.editPage, /name: branch\.name \?\? ""/);
assert.match(text.editPage, /prefix: branch\.prefix \?\? ""/);
assert.match(text.editPage, /address: branch\.address \?\? ""/);
assert.match(text.editPage, /phone: branch\.phone \?\? ""/);
assert.match(text.editPage, /telephone: branch\.telephone \?\? ""/);
assert.match(text.editPage, /imageUrl: branch\.imageUrl \?\? ""/);

assert.match(text.validation, /name: z\.string\(\)\.min\(1, "Branch name is required"\)/);
assert.match(text.validation, /prefix: z\.string\(\)\.min\(1, "Branch prefix is required"\)/);
assert.match(text.validation, /address: z\.string\(\)\.min\(1, "Branch location is required"\)/);
assert.match(text.validation, /phone: z\.string\(\)\.default\(""\)/);
assert.match(text.validation, /telephone: z\.string\(\)\.default\(""\)/);
assert.match(text.validation, /isActive: z\.boolean\(\)\.default\(true\)/);

assert.match(text.form, /const DEFAULT_BRANCH_PHOTO = "\/images\/BranchPhoto\/default\.jpg"/);
assert.match(text.form, /function branchImageSrc\(imageUrl: string\)/);
assert.match(text.form, /return `\/images\/BranchPhoto\/\$\{imageUrl\}`/);
assert.match(text.form, /uploadFileWithPresign\(\{[\s\S]*scope: "branch"[\s\S]*ownerId: branchId/);
assert.match(text.form, /createBranch\(payload\)/);
assert.match(text.form, /setNewBranchImage\([\s\S]*createdBranch\.id[\s\S]*uploadedImageUrl/);
assert.match(text.form, /updateBranch\(branch!\.id/);
assert.match(text.form, /toast\.success\("Branch created successfully"\)/);
assert.match(text.form, /toast\.success\("Branch updated successfully"\)/);
assert.match(text.form, /router\.push\("\/branches"\)/);
assert.match(text.form, /Branch Name/);
assert.match(text.form, /Prefix \/ Code/);
assert.match(text.form, /Branch Location/);
assert.match(text.form, /Mobile/);
assert.match(text.form, /Telephone/);
assert.match(text.form, /Status/);

assert.match(text.actions, /export async function createBranch/);
assert.match(text.actions, /requireLegacyActionAllowed\(ctx, "addBranch"\)/);
assert.match(text.actions, /prefix: data\.prefix \?\? null/);
assert.match(text.actions, /address: data\.address \?\? null/);
assert.match(text.actions, /phone: data\.phone \?\? null/);
assert.match(text.actions, /telephone: data\.telephone \?\? null/);
assert.match(text.actions, /imageUrl: data\.imageUrl \?\? null/);
assert.match(text.actions, /export async function updateBranch/);
assert.match(text.actions, /requireLegacyActionAllowed\(ctx, "updateBranch"\)/);
assert.match(text.actions, /verifyBranchAccess\(id, ctx\.organizationId\)/);
assert.match(text.actions, /if \(data\.prefix !== undefined\) updateData\.prefix = data\.prefix/);
assert.match(text.actions, /if \(data\.imageUrl !== undefined\) updateData\.imageUrl = data\.imageUrl/);
assert.match(text.actions, /export async function setNewBranchImage/);
assert.match(text.actions, /requireLegacyActionAllowed\(ctx, "addBranch"\)/);

assert.match(text.actionPermissions, /"addBranch"/);
assert.match(text.actionPermissions, /"updateBranch"/);
assert.match(text.actionPermissions, /"deleteBranch"/);
assert.match(text.guardMap, /legacyPage: "branches\.php"[\s\S]*"\/branch\.php"/);

assert.match(text.migration, /Migration: t_branch/);
assert.match(text.migration, /legacyTable: "t_branch"/);
assert.match(text.migration, /prefix: row\.prefix \|\| null/);
assert.match(text.migration, /phone: row\.mobile \|\| null/);
assert.match(text.migration, /telephone: row\.tel \|\| null/);
assert.match(text.migration, /const imageUrl = cleanLegacyFileName\(row\.image\)/);
assert.match(text.migration, /isActive: toBool\(row\.active\)/);
assert.match(
  text.fileRules,
  /\| `t_branch` \| `image` \| `BranchPhoto` \| `Branch\.imageUrl` \|/,
);

type MatrixRow = {
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) => entry.modernRoute === "/branch.php, /branches/new, /branches/[id]/edit",
);

assert.ok(row);
assert.match(row.status ?? "", /legacy branch add\/edit bridge and ACL restored/);
assert.match(row.verification ?? "", /Branch Name, Branch Location, Branch Prefix, Mobile, Telephone/);
assert.match(row.verification ?? "", /addBranch/);
assert.match(row.verification ?? "", /updateBranch/);
assert.match(row.verification ?? "", /`\/branch\.php` without `id`/);
assert.match(row.verification ?? "", /uploaded file storage path parity/);

assert.match(
  text.matrixMd,
  /branch\.php \| Front\/templates\/admin\/js\/branch\.js \| \/branch\.php, \/branches\/new, \/branches\/\[id\]\/edit \| partial - legacy branch add\/edit bridge and ACL restored; visual\/layout audit remains/,
);
assert.match(
  text.matrixMd,
  /branch\.php[\s\S]*Branch Name, Branch Location, Branch Prefix, Mobile, Telephone/,
);
assert.match(
  text.matrixMd,
  /branch\.php[\s\S]*`\/branch\.php` without `id` now resolves to the modern New Branch form/,
);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

console.log("legacy branch form contract assertions passed");
