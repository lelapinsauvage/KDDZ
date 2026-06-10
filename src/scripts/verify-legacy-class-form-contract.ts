import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/class.php",
  legacyJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/class.js",
  bridge: "src/app/(app)/class.php/page.tsx",
  page: "src/app/(app)/classes/page.tsx",
  client: "src/components/classes/classes-client.tsx",
  actions: "src/lib/actions/classes.ts",
  legacyClass: "src/lib/legacy-class.ts",
  legacyId: "src/lib/legacy-id.ts",
  actionPermissions: "src/lib/legacy-class-action-permissions.ts",
  guardMap: "src/lib/legacy-page-guards.ts",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [
    key,
    readFileSync(path, "utf8"),
  ]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyPhp, /Check::protectPageOrFunction\('classes\.php'\)/);
assert.match(text.legacyPhp, /<title>Class Edit<\/title>/);
assert.match(text.legacyPhp, /\$branch = \$db->getBranches\(\)/);
assert.match(text.legacyPhp, /\$class = \$db->getClasses\(\)/);
assert.match(text.legacyPhp, /\$teacher = \$db->getTeacher\(\)/);
assert.match(text.legacyPhp, /protect\("\*"\)/);
assert.match(text.legacyPhp, /\$encrid = \$_REQUEST\["id"\]/);
assert.match(text.legacyPhp, /encrypt_decrypt\('decrypt', \$encrid\)/);
assert.match(text.legacyPhp, /<input type="hidden" id="emp_id" value="<\?= \$emp_id \?>" >/);
assert.match(text.legacyPhp, /id="IdImageUpload" src="\.\/images\/ClassPhoto\/default\.jpg"/);
assert.match(text.legacyPhp, /name="fileToUpload" id="ProfileImage" accept="image\/\*"/);
assert.match(text.legacyPhp, /Class Info\./);
assert.match(text.legacyPhp, /id="branch_id"[\s\S]*Select Branch/);
assert.match(text.legacyPhp, /id="classname"/);
assert.match(text.legacyPhp, /id="class_language"/);
assert.match(text.legacyPhp, /list = "languages"/);
assert.match(text.legacyPhp, /id="age_from"/);
assert.match(text.legacyPhp, /name="radiofrom" checked[\s\S]*id="year_f" value="year"/);
assert.match(text.legacyPhp, /name="radiofrom"[\s\S]*id="month_f" value="month"/);
assert.match(text.legacyPhp, /id="age_to"/);
assert.match(text.legacyPhp, /name="radioto" checked[\s\S]*id="year_t" value="year"/);
assert.match(text.legacyPhp, /name="radioto"[\s\S]*id="month_t" value="month"/);
assert.match(text.legacyPhp, /id="camera_number"/);
assert.match(text.legacyPhp, /id="max_students"/);
assert.match(text.legacyPhp, /<datalist id = "languages">[\s\S]*English[\s\S]*Arabic[\s\S]*French/);
assert.match(text.legacyPhp, /class="btn btn-success btn-circle btn-fill btn-wd btnUpdate"> Save <\/button>/);
assert.match(text.legacyPhp, /<script src="js\/class\.js" type="text\/javascript"><\/script>/);

assert.match(text.legacyJs, /function Create\(\)/);
assert.match(text.legacyJs, /function Update\(ac_no\)/);
assert.match(text.legacyJs, /var branch_id= \$\("#branch_id"\)\.val\(\)/);
assert.match(text.legacyJs, /var classname= \$\("#classname"\)\.val\(\)/);
assert.match(text.legacyJs, /var class_language= \$\("#class_language"\)\.val\(\)/);
assert.match(text.legacyJs, /var age_from= \$\("#age_from"\)\.val\(\)/);
assert.match(text.legacyJs, /var age_to= \$\("#age_to"\)\.val\(\)/);
assert.match(text.legacyJs, /var camera_number= \$\("#camera_number"\)\.val\(\)/);
assert.match(text.legacyJs, /var max_students= \$\("#max_students"\)\.val\(\)/);
assert.match(text.legacyJs, /\$\('\[name="radiofrom"\]:checked'\)\.val\(\)/);
assert.match(text.legacyJs, /\$\('\[name="radioto"\]:checked'\)\.val\(\)/);
assert.match(text.legacyJs, /max_students == "" \|\| max_students <= 0/);
assert.match(text.legacyJs, /Please Fill the mendatory Fields \(RED\) !!/);
assert.match(text.legacyJs, /formdata\.append\('image', \$\('#ProfileImage'\)\.prop\('files'\)\[0\]\)/);
assert.match(text.legacyJs, /formdata\.append\('branch_id', branch_id\)/);
assert.match(text.legacyJs, /formdata\.append\('classname', classname\)/);
assert.match(text.legacyJs, /formdata\.append\('class_language', class_language\)/);
assert.match(text.legacyJs, /formdata\.append\('age_from', age_from\)/);
assert.match(text.legacyJs, /formdata\.append\('age_to', age_to\)/);
assert.match(text.legacyJs, /formdata\.append\('camera_number', camera_number\)/);
assert.match(text.legacyJs, /formdata\.append\('max_students', max_students\)/);
assert.match(text.legacyJs, /formdata\.append\('radiofrom', radiofrom\)/);
assert.match(text.legacyJs, /formdata\.append\('radioto', radioto\)/);
assert.match(text.legacyJs, /url: '\.\.\/\.\.\/\.\.\/ajax\/v1\/AddClass'/);
assert.match(text.legacyJs, /url: '\.\.\/\.\.\/\.\.\/ajax\/v1\/UpdateClass'/);
assert.match(text.legacyJs, /formdata\.append\('class_id', ac_no\)/);
assert.match(text.legacyJs, /toast\('success', "Class has been created"\)/);
assert.match(text.legacyJs, /toast\('success', "Class has been Updated"\)/);
assert.match(text.legacyJs, /function readURL\(input\)/);
assert.match(text.legacyJs, /\.profile_image'\)\.attr\('src', e\.target\.result\)/);
assert.match(text.legacyJs, /if \(\$\(("#emp_id"| '#emp_id')\)\.val\(\) != 0\)/);
assert.match(text.legacyJs, /\$\("\.btnUpdate"\)\.text\(" Update Class "\)/);
assert.match(text.legacyJs, /url: '\.\.\/\.\.\/\.\.\/ajax\/v1\/getclassdata'/);
assert.match(text.legacyJs, /\$\("#branch_id"\)\.val\(mydata\['class_data'\]\['branch_id'\]\)/);
assert.match(text.legacyJs, /\$\("#classname"\)\.val\(mydata\['class_data'\]\['classname'\]\)/);
assert.match(text.legacyJs, /\$\("#class_language"\)\.val\(mydata\['class_data'\]\['class_language'\]\)/);
assert.match(text.legacyJs, /\$\("#age_from"\)\.val\(mydata\['class_data'\]\['age_from'\]\)/);
assert.match(text.legacyJs, /\$\("#age_to"\)\.val\(mydata\['class_data'\]\['age_to'\]\)/);
assert.match(text.legacyJs, /\$\("#camera_number"\)\.val\(mydata\['class_data'\]\['camera_number'\]\)/);
assert.match(text.legacyJs, /\$\("#max_students"\)\.val\(mydata\['class_data'\]\['max_students'\]\)/);
assert.match(text.legacyJs, /mydata\['class_data'\]\['radiofrom'\] == 'month'/);
assert.match(text.legacyJs, /mydata\['class_data'\]\['radioto'\] == 'month'/);
assert.match(text.legacyJs, /images\/ClassPhoto\/" \+ mydata\['class_data'\]\['image'\]/);
assert.match(text.legacyJs, /\$\("#ProfileImage"\)\.on\("change"/);
assert.match(text.legacyJs, /\$\("\.btnUpdate"\)\.on\("click"/);
assert.match(text.legacyJs, /ids == 0[\s\S]*Create\(\)[\s\S]*Update\(ids\)/);
assert.match(text.legacyJs, /WebSocket connection closed/);

assert.match(text.bridge, /getLegacyClassActionPermissions\(ctx\)/);
assert.match(text.bridge, /if \(!id\?\.trim\(\)\)/);
assert.match(text.bridge, /!permissions\.canAddClass[\s\S]*redirect\("\/forbidden\.php"\)/);
assert.match(text.bridge, /redirect\("\/classes\?new=1"\)/);
assert.match(text.bridge, /!permissions\.canUpdateClass[\s\S]*redirect\("\/forbidden\.php"\)/);
assert.match(text.bridge, /resolveLegacyClassId\(id\)/);
assert.match(text.bridge, /notFound\(\)/);
assert.match(text.bridge, /redirect\(`\/classes\?edit=\$\{encodeURIComponent\(classId\)\}`\)/);

assert.match(text.page, /params\.new === "1" && !actionPermissions\.canAddClass/);
assert.match(text.page, /params\.edit && !actionPermissions\.canUpdateClass/);
assert.match(text.page, /initialEditClassId=\{params\.edit\}/);
assert.match(text.page, /initialAddOpen=\{params\.new === "1"\}/);

assert.match(text.legacyClass, /decodeMaybeURIComponent\(identifier\.trim\(\)\)/);
assert.match(text.legacyClass, /legacyNumericCandidates\(identifier\)/);
assert.match(text.legacyClass, /UUID_PATTERN\.test\(normalizedIdentifier\)/);
assert.match(text.legacyClass, /legacyId: \{ in: legacyIds \}/);
assert.match(text.legacyClass, /legacyKey: normalizedIdentifier/);
assert.match(text.legacyClass, /branch: \{ organizationId \}/);
assert.match(text.legacyId, /createDecipheriv\("aes-256-cbc"/);
assert.match(text.legacyId, /update\("LeBarbarGard"\)/);
assert.match(text.legacyId, /export function legacyNumericCandidates/);

assert.match(text.client, /const DEFAULT_CLASS_PHOTO = "\/images\/ClassPhoto\/default\.jpg"/);
assert.match(text.client, /function emptyForm\(branchId\?: string\): ClassFormState/);
assert.match(text.client, /ageFromUnit: "YEARS"/);
assert.match(text.client, /ageToUnit: "YEARS"/);
assert.match(text.client, /function classToForm\(cls: ClassItem\): ClassFormState/);
assert.match(text.client, /language: cls\.language \?\? ""/);
assert.match(text.client, /cameraNumber: cls\.cameraNumber\?\.toString\(\) \?\? ""/);
assert.match(text.client, /maxStudents: cls\.maxStudents\.toString\(\)/);
assert.match(text.client, /function classPhotoSrc\(imageUrl: string \| null\)/);
assert.match(text.client, /return `\/images\/ClassPhoto\/\$\{imageUrl\}`/);
assert.match(text.client, /function ClassForm\(/);
assert.match(
  text.client,
  /const displayImageUrl = imagePreviewUrl \|\| classPhotoSrc\(form\.imageUrl \|\| null\)/,
);
assert.match(text.client, /Label>Class Image<\/Label>/);
assert.match(text.client, /type="file"[\s\S]*accept="image\/\*"/);
assert.match(text.client, /Drop an image or click to browse/);
assert.match(text.client, /Label>Branch \*<\/Label>/);
assert.match(text.client, /SelectValue placeholder="Select Branch"/);
assert.match(text.client, /Label>Class Name \*<\/Label>/);
assert.match(text.client, /Label>Class Language \*<\/Label>/);
assert.match(text.client, /SelectItem value="English">English<\/SelectItem>/);
assert.match(text.client, /SelectItem value="Arabic">Arabic<\/SelectItem>/);
assert.match(text.client, /SelectItem value="French">French<\/SelectItem>/);
assert.match(text.client, /Label>Age From \*<\/Label>/);
assert.match(text.client, /SelectItem value="YEARS">Years<\/SelectItem>/);
assert.match(text.client, /SelectItem value="MONTHS">Months<\/SelectItem>/);
assert.match(text.client, /Label>Age To \*<\/Label>/);
assert.match(text.client, /Label>Camera Number \*<\/Label>/);
assert.match(text.client, /Label>Max Number Of Students \*<\/Label>/);
assert.match(text.client, /id="class-active"/);
assert.match(text.client, /Active/);
assert.match(text.client, /const initialEditTarget =[\s\S]*canUpdateClass && initialEditClassId/);
assert.match(text.client, /const \[addOpen, setAddOpen\] = useState\([\s\S]*initialAddOpen && !initialEditTarget && canAddClass/);
assert.match(text.client, /function openAdd\(\)[\s\S]*setForm\(emptyForm\(branchId\)\)[\s\S]*setAddOpen\(true\)/);
assert.match(text.client, /const openEdit = useCallback\(\(cls: ClassItem\) => \{[\s\S]*setForm\(classToForm\(cls\)\)[\s\S]*setEditTarget\(cls\)/);
assert.match(text.client, /function validateFormState\(\)/);
assert.match(text.client, /if \(!form\.branchId\) return "Branch is required"/);
assert.match(text.client, /if \(!form\.name\.trim\(\)\) return "Class name is required"/);
assert.match(text.client, /if \(!form\.language\.trim\(\)\) return "Class language is required"/);
assert.match(text.client, /if \(form\.ageFrom === ""\) return "Age from is required"/);
assert.match(text.client, /if \(form\.ageTo === ""\) return "Age to is required"/);
assert.match(text.client, /if \(form\.cameraNumber === ""\) return "Camera number is required"/);
assert.match(text.client, /Max students must be greater than zero/);
assert.match(text.client, /async function resolveImageUrlForSave\(ownerId\?: string\)/);
assert.match(text.client, /scope: "class"/);
assert.match(text.client, /function savePayload\(imageUrl: string \| null\)/);
assert.match(text.client, /name: form\.name\.trim\(\)/);
assert.match(text.client, /branchId: form\.branchId/);
assert.match(text.client, /language: form\.language\.trim\(\)/);
assert.match(text.client, /ageFrom: Number\(form\.ageFrom\)/);
assert.match(text.client, /ageTo: Number\(form\.ageTo\)/);
assert.match(text.client, /ageFromUnit: form\.ageFromUnit/);
assert.match(text.client, /ageToUnit: form\.ageToUnit/);
assert.match(text.client, /cameraNumber: Number\(form\.cameraNumber\)/);
assert.match(text.client, /maxStudents: Number\(form\.maxStudents\)/);
assert.match(text.client, /imageUrl,/);
assert.match(text.client, /isActive: form\.isActive/);
assert.match(text.client, /const result = await createClass\(savePayload\(imageUrl\)\)/);
assert.match(text.client, /const result = await updateClass\(editTarget\.id, savePayload\(imageUrl\)\)/);
assert.match(text.client, /<DialogTitle>New Class<\/DialogTitle>/);
assert.match(text.client, /<DialogTitle>Update Class<\/DialogTitle>/);
assert.match(text.client, /hideBranch=\{!!branchId\}/);

assert.match(text.actions, /export async function createClass\(data: ClassData\)/);
assert.match(text.actions, /requireLegacyActionAllowed\(ctx, "addClass"\)/);
assert.match(text.actions, /verifyBranchAccess\(data\.branchId, ctx\.organizationId\)/);
assert.match(text.actions, /language: data\.language \?\? null/);
assert.match(text.actions, /ageFrom: data\.ageFrom \?\? null/);
assert.match(text.actions, /ageTo: data\.ageTo \?\? null/);
assert.match(text.actions, /ageFromUnit: data\.ageFromUnit \?\? null/);
assert.match(text.actions, /ageToUnit: data\.ageToUnit \?\? null/);
assert.match(text.actions, /cameraNumber: data\.cameraNumber \?\? null/);
assert.match(text.actions, /maxStudents: data\.maxStudents \?\? 0/);
assert.match(text.actions, /capacity: data\.maxStudents \?\? 0/);
assert.match(text.actions, /imageUrl: data\.imageUrl \?\? null/);
assert.match(text.actions, /isActive: data\.isActive \?\? true/);
assert.match(text.actions, /export async function updateClass\(id: string, data: Partial<ClassData>\)/);
assert.match(text.actions, /requireLegacyActionAllowed\(ctx, "updateClass"\)/);
assert.match(text.actions, /updateData\.maxStudents = data\.maxStudents/);
assert.match(text.actions, /updateData\.capacity = data\.maxStudents/);
assert.match(text.actions, /updateData\.imageUrl = data\.imageUrl/);
assert.match(text.actions, /updateData\.isActive = data\.isActive/);
assert.match(text.actions, /updateData\.branch = \{ connect: \{ id: data\.branchId \} \}/);
assert.match(text.actionPermissions, /"addClass"/);
assert.match(text.actionPermissions, /"updateClass"/);
assert.match(text.guardMap, /legacyPage: "classes\.php"[\s\S]*"\/class\.php"/);

type MatrixRow = {
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const matrixRow = matrix.find(
  (row) => row.modernRoute === "/class.php, /classes?new=1, /classes?edit=",
);
assert.ok(matrixRow);
assert.equal(
  matrixRow.status,
  "restored - legacy class add/edit bridge, fields, image preview, ACL, and save/update payload parity restored",
);
assert.match(
  matrixRow.verification ?? "",
  /verify-legacy-class-form-contract\.ts/,
);
assert.match(
  matrixRow.verification ?? "",
  /Browser smoke confirmed `\/class\.php` opens `\/classes\?new=1`/,
);
assert.match(
  matrixRow.verification ?? "",
  /`\/class\.php\?id=` opens `\/classes\?edit=`/,
);

const markdownRow = text.markdownMatrix
  .split("\n")
  .find((line) => line.includes("| Front/templates/admin/class.php |"));
assert.match(
  markdownRow ?? "",
  /restored - legacy class add\/edit bridge, fields, image preview, ACL, and save\/update payload parity restored/,
);
assert.match(markdownRow ?? "", /verify-legacy-class-form-contract\.ts/);
assert.match(markdownRow ?? "", /Browser smoke confirmed `\/class\.php` opens `\/classes\?new=1`/);
assert.match(markdownRow ?? "", /`\/class\.php\?id=` opens `\/classes\?edit=`/);
assert.doesNotMatch(markdownRow ?? "", /visual\/layout audit remains/);

console.log("legacy class form contract assertions passed");
