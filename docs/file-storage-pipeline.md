# File Storage Pipeline

The legacy PHP app stored uploads in `Front/templates/admin/images/<directory>` and kept only the filename in MySQL. The modern app needs object keys, provider URLs, metadata, and enough provenance to update migrated records without guessing.

## Current Pipeline

1. `audit-legacy-files.ts` checks each legacy file table/column against the legacy app backup and reports found, missing, default, unsafe, table-missing, and column-missing references.
2. `export-legacy-files.ts` copies found files into a provider-neutral package under deterministic keys:

   ```text
   legacy/<source-database>/<rule-id>/<legacy-id>/<legacy-filename>
   ```

3. `upload-legacy-file-export.ts` uploads that package to the configured storage provider and writes an upload manifest with source row provenance, object keys, public URLs, byte counts, and upload status.
4. `apply-legacy-file-urls.ts` reads the upload manifest and updates migrated rows where the modern table has strong legacy provenance.

The upload manifest is the cutover artifact for the database URL rewrite step. It preserves `sourceDatabase`, `legacyTable`, `legacyColumn`, `legacyId`, `ownerId`, `ruleId`, `modernDestination`, `storageKey`, `objectKey`, and `publicUrl`.

## Storage Providers

The shared server-side adapter lives in `src/lib/storage/object-storage.ts`.

| Provider | Use | Required env |
| --- | --- | --- |
| `local` | Dev and migration rehearsal. Copies objects to a filesystem root. | `STORAGE_PROVIDER=local`, optional `STORAGE_LOCAL_ROOT`, optional `STORAGE_PUBLIC_BASE_URL` |
| `s3` | AWS S3 or S3-compatible storage. | `STORAGE_PROVIDER=s3`, `STORAGE_BUCKET`, `STORAGE_REGION`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`, optional `STORAGE_ENDPOINT`, optional `STORAGE_PUBLIC_BASE_URL` |
| `r2` | Cloudflare R2. | `STORAGE_PROVIDER=r2`, `STORAGE_BUCKET`, `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`, optional `STORAGE_REGION=auto`, optional `STORAGE_PUBLIC_BASE_URL` |

Optional env:

- `STORAGE_KEY_PREFIX`: Prefix every uploaded object key, for example `prod` or `garderie/prod`.
- `STORAGE_FORCE_PATH_STYLE`: Override SDK path-style behavior. Defaults to `true` for R2 or custom endpoints.
- `STORAGE_PUBLIC_BASE_URL`: CDN/public base used to produce `publicUrl` in manifests. Without it, S3/R2 uploads still work but `publicUrl` is `null`.

## Commands

Audit:

```bash
LEGACY_APP_ROOT="/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup" \
MYSQL_DATABASE=kiddzonl_garderie29sept \
pnpm tsx src/scripts/migration/audit-legacy-files.ts \
  --json=/tmp/kiddzonl-legacy-file-audit.json
```

Export:

```bash
LEGACY_APP_ROOT="/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup" \
MYSQL_DATABASE=kiddzonl_garderie29sept \
pnpm tsx src/scripts/migration/export-legacy-files.ts \
  --out-dir=/tmp/kiddzonl-legacy-file-export
```

Local rehearsal upload:

```bash
STORAGE_PROVIDER=local \
STORAGE_LOCAL_ROOT=/tmp/kiddzonl-storage \
STORAGE_PUBLIC_BASE_URL=/storage \
pnpm tsx src/scripts/migration/upload-legacy-file-export.ts \
  --manifest=/tmp/kiddzonl-legacy-file-export/manifest.json \
  --out-manifest=/tmp/kiddzonl-legacy-file-upload.json
```

Cloudflare R2 upload:

```bash
STORAGE_PROVIDER=r2 \
STORAGE_BUCKET=<bucket> \
STORAGE_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com \
STORAGE_ACCESS_KEY_ID=<access-key-id> \
STORAGE_SECRET_ACCESS_KEY=<secret-access-key> \
STORAGE_PUBLIC_BASE_URL=https://<cdn-host> \
pnpm tsx src/scripts/migration/upload-legacy-file-export.ts \
  --manifest=/tmp/kiddzonl-legacy-file-export/manifest.json \
  --out-manifest=/tmp/kiddzonl-legacy-file-upload.json \
  --fail-on-warning
```

AWS S3 upload:

```bash
STORAGE_PROVIDER=s3 \
STORAGE_BUCKET=<bucket> \
STORAGE_REGION=<region> \
STORAGE_ACCESS_KEY_ID=<access-key-id> \
STORAGE_SECRET_ACCESS_KEY=<secret-access-key> \
STORAGE_PUBLIC_BASE_URL=https://<cdn-host> \
pnpm tsx src/scripts/migration/upload-legacy-file-export.ts \
  --manifest=/tmp/kiddzonl-legacy-file-export/manifest.json \
  --out-manifest=/tmp/kiddzonl-legacy-file-upload.json \
  --fail-on-warning
```

Use `--dry-run` to validate package paths and object keys without uploading. Use `--rule=<rule-id>` to isolate one legacy rule. By default existing objects are skipped; pass `--overwrite` only during a controlled rerun.

Apply uploaded URLs to migrated rows:

```bash
pnpm tsx src/scripts/migration/apply-legacy-file-urls.ts \
  --manifest=/tmp/kiddzonl-legacy-file-upload.json \
  --out-manifest=/tmp/kiddzonl-legacy-file-url-apply.json \
  --dry-run
```

Remove `--dry-run` only after reviewing the apply manifest. The script updates strong-provenance destinations:

| Rule | Target |
| --- | --- |
| `child-document` | `ChildAttachment.fileUrl` |
| `garderie-document` | `BranchDocument.fileUrl` |
| `doctor-photo` | `Doctor.imageUrl` |
| `doctor-document` | `DoctorAttachment.fileUrl` |
| `manager-document` | `ManagerAttachment.fileUrl` |
| `payment-receipt` | `Payment.receiptFileUrl` |
| `form-attachment` | `FormAttachment.fileUrl` |

The script reports, but does not guess, no-provenance destinations such as branch/class/child/staff profile photos, teacher/nurse attachments, daily report attachments, and absence attachments. Those tables need legacy source fields added or an approved deterministic matching strategy before URL rewrite.

## Cutover Gates

- The audit has no unresolved unsafe filenames.
- Missing source files are either recovered from another legacy backup or explicitly accepted.
- The export manifest has the expected exported count for the canonical production dump.
- The upload manifest has zero `missing-package-file`, `unsafe-key`, and `error` entries.
- `STORAGE_PUBLIC_BASE_URL` is set for production so migrated records can resolve to stable URLs.
- Runtime upload routes use `createPresignedUploadUrl()` with authenticated org/branch permission checks before UI upload placeholders are enabled.
- `apply-legacy-file-urls.ts` has zero unresolved `missing-public-url`, `not-found`, `no-provenance`, `unsupported-destination`, and `error` entries for every rule approved for cutover.
- `reconcile-migration-counts.ts` confirms counts still match after URL rewrite.
