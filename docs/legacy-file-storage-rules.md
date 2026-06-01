# Legacy File Storage Rules

Legacy PHP stored uploaded files under `Front/templates/admin/images/<directory>` and saved only the filename in MySQL. The upload helper allowed image extensions only (`png`, `gif`, `jpg`, `jpeg`, `bmp`, including uppercase variants), resized the image, and named most uploads as `{$_SESSION["jigowatt"]["dbid"]}{md5(row_id)}.{ext}`.

The canonical rule table for automation lives in `src/scripts/migration/legacy-file-rules.ts`. Run the audit before importing files:

```bash
LEGACY_APP_ROOT="/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup" \
MYSQL_DATABASE=kiddzonl_garderie29sept \
pnpm tsx src/scripts/migration/audit-legacy-files.ts --json=legacy-file-audit.json
```

To stage a provider-neutral file export package for S3/R2 upload, run:

```bash
LEGACY_APP_ROOT="/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup" \
MYSQL_DATABASE=kiddzonl_garderie29sept \
pnpm tsx src/scripts/migration/export-legacy-files.ts \
  --out-dir=/tmp/kiddzonl-legacy-file-export
```

The export script copies found files under deterministic keys like `legacy/<database>/<rule>/<legacy-id>/<filename>` and writes a `manifest.json` with every exported, missing, default, unsafe, table-missing, or column-missing reference.

Then upload the package with the configured storage provider:

```bash
STORAGE_PROVIDER=local \
STORAGE_LOCAL_ROOT=/tmp/kiddzonl-storage \
STORAGE_PUBLIC_BASE_URL=/storage \
pnpm tsx src/scripts/migration/upload-legacy-file-export.ts \
  --manifest=/tmp/kiddzonl-legacy-file-export/manifest.json \
  --out-manifest=/tmp/kiddzonl-legacy-file-upload.json
```

Use `STORAGE_PROVIDER=s3` for AWS S3 or `STORAGE_PROVIDER=r2` for Cloudflare R2, with `STORAGE_BUCKET`, credentials, and `STORAGE_PUBLIC_BASE_URL` set. The upload manifest records object keys, public URLs, byte counts, and source row provenance for the later database URL rewrite. Full provider settings and cutover gates are documented in `docs/file-storage-pipeline.md`.

After upload, run `apply-legacy-file-urls.ts --dry-run` against the upload manifest to preview PostgreSQL URL rewrites. After rerunning migrations with `20260601017000_add_legacy_file_provenance`, it updates every direct URL/photo target by source provenance and still reports `child-history-photo` for a dedicated JSON snapshot patch.

| Legacy Table | Column | Legacy Directory | Modern Destination | PHP Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| `t_branch` | `image` | `BranchPhoto` | `Branch.imageUrl` | `Data.class.php:6880`, views `3742/3809` | source path identified; filename preserved by `migrate-branches.ts`; needs object storage import |
| `t_class` | `image` | `ClassPhoto` | `Class.imageUrl` | `Data.class.php:7012`, views `3576/3634` | source path identified; filename preserved by `migrate-classes.ts`; needs object storage import |
| `t_child` | `image` | `EmpPhoto` | `Child.photo` | `Data.class.php:11594`, views `431/705/913/1126/1383` | source path identified; filename preserved by `migrate-children.ts`; needs object storage import |
| `t_child_draft` | `image` | `EmpPhoto` | `Child.photo` for draft imports | `Data.class.php:11594` | source path identified; filename preserved by `migrate-children.ts`; needs object storage import |
| `t_child_h` | `image` | `EmpPhoto` | `ChildHistory.snapshot.image` | `Data.class.php:11594` | source path identified; filename preserved by `migrate-children.ts`; needs object storage import |
| `t_attachments` | `url` | `EmpDocs` | `ChildAttachment.fileUrl` | `Data.class.php:9361/11602`, `ajax/v1/index.php:4151` | source path identified; data rows migrated; needs object storage import |
| `t_garderie_attachments` | `url` | `Garderie` | `BranchDocument.fileUrl` | `Data.class.php:9394/9402/9427`, `ajax/v1/index.php:4168` | source path identified; data rows migrated; needs object storage import |
| `t_teacher` | `image` | `TeacherPhoto` | `Teacher.imageUrl` | `Data.class.php:7850`, views `1611/4242/4305` | source path identified; filename preserved by `migrate-employees.ts`; needs object storage import |
| `t_teacher_attachments` | `url` | `TeacherDocs` | `TeacherAttachment.fileUrl` | `Data.class.php:7733/7843/13754`, `ajax/v1/index.php:3591/3626/3665` | source path identified; filename preserved by `migrate-employees.ts`; needs object storage import |
| `t_nurse` | `image` | `NursePhoto` | `Nurse.imageUrl` | `Data.class.php:7871`, views `4002/4062` | source path identified; filename preserved by `migrate-employees.ts`; needs object storage import |
| `t_nurse_attachments` | `url` | `NurseDocs` | `NurseAttachment.fileUrl` | `Data.class.php:7805/13990`, `ajax/v1/index.php:3724` | source path identified; filename preserved by `migrate-employees.ts`; needs object storage import |
| `t_garderie_doctor` | `image` | `DoctorPhoto` | `Doctor.imageUrl` | `Data.class.php:7864`, views `3879/3941` | source path identified; data rows migrated; needs object storage import |
| `t_garderie_doctor_attachments` | `url` | `DoctorDocs` | `DoctorAttachment.fileUrl` | `Data.class.php:7788/13891`, `ajax/v1/index.php:3705` | source path identified; data rows migrated; needs object storage import |
| `t_manager` | `image` | `ManagerPhoto` | `Manager.imageUrl` | `Data.class.php:7857`, views `4123/4183` | source path identified; filename preserved by `migrate-employees.ts`; needs object storage import |
| `t_manager_attachments` | `url` | `ManagerDocs` | `ManagerAttachment.fileUrl` | `Data.class.php:7737/13829`, `ajax/v1/index.php:3608/3645/3684` | source path identified; data rows migrated; needs object storage import |
| `t_payments` | `image` | `AccDocs` | `Payment.receiptFileUrl` | `Data.class.php:11413`, views `9695/9969/10157/13618` | source path identified; receipt filename preserved by `migrate-payments.ts`; needs object storage import |
| `t_daily_attachments` | `url` | `RepDocs` | `DailyReportAttachment.fileUrl` | `Data.class.php:20061/20073`, `ajax/v1/index.php:3765` | source path identified; filename preserved by `migrate-daily-reports.ts`; needs object storage import |
| `t_absent_attachments` | `url` | `AbsDocs` | `AbsenceAttachment.fileUrl` | `Data.class.php:20105/20117`, `ajax/v1/index.php:3781` | source path identified; filename preserved by `migrate-absences.ts`; needs object storage import |
| `t_forms_attachments` | `url` | `MedForms` | `FormAttachment.fileUrl` | `Data.class.php:15049/21112`, `ajax/v1/index.php:4277` | source path identified; filename preserved by `migrate-medical.ts`; needs object storage import |

The audit intentionally treats `default.jpg`, empty strings, and `0` as defaults rather than missing files. Any value containing path separators, `..`, null bytes, or an absolute path is flagged as unsafe and must not be imported directly.
