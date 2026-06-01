import fs from "fs";
import path from "path";

import {
  contentTypeForFilename,
  getObjectStorageConfig,
  normalizeStorageKey,
  objectKeyForStorageKey,
  publicUrlForObjectKey,
  putObjectFromFile,
  type ObjectStorageConfig,
  type ObjectStorageProvider,
} from "../../lib/storage/object-storage";
import { log, logError } from "./lib/utils";

type ExportStatus =
  | "exported"
  | "found"
  | "missing"
  | "default"
  | "unsafe"
  | "table-missing"
  | "column-missing";

type UploadStatus =
  | "uploaded"
  | "skipped"
  | "dry-run"
  | "not-exported"
  | "missing-package-file"
  | "unsafe-key"
  | "error";

interface LegacyFileExportEntry {
  status: ExportStatus;
  sourceDatabase: string;
  ruleId: string;
  legacyTable: string;
  legacyColumn: string;
  legacyId: number | string | null;
  ownerId: number | string | null;
  title: string | null;
  active: number | string | null;
  filename: string | null;
  sourcePath: string | null;
  storageKey: string | null;
  modernDestination: string;
  modernStorageKeyPrefix: string;
  reason?: string;
}

interface LegacyFileExportManifest {
  generatedAt: string;
  dryRun: boolean;
  sourceDatabase: string;
  legacyRoot: string;
  outDir: string | null;
  totals: {
    exported: number;
    found: number;
    missing: number;
    defaults: number;
    unsafe: number;
    skipped: number;
  };
  summaries: unknown[];
  entries: LegacyFileExportEntry[];
}

interface LegacyFileUploadEntry {
  status: UploadStatus;
  sourceDatabase: string;
  ruleId: string;
  legacyTable: string;
  legacyColumn: string;
  legacyId: number | string | null;
  ownerId: number | string | null;
  title: string | null;
  active: number | string | null;
  filename: string | null;
  exportStatus: ExportStatus;
  packagePath: string | null;
  storageKey: string | null;
  objectKey: string | null;
  publicUrl: string | null;
  bytes: number | null;
  provider: ObjectStorageProvider;
  bucket: string | null;
  modernDestination: string;
  modernStorageKeyPrefix: string;
  reason?: string;
}

interface LegacyFileUploadManifest {
  generatedAt: string;
  sourceManifest: string;
  sourceManifestGeneratedAt: string;
  sourceDatabase: string;
  packageDir: string;
  dryRun: boolean;
  overwrite: boolean;
  provider: ObjectStorageProvider;
  bucket: string | null;
  endpoint: string | null;
  localRoot: string | null;
  keyPrefix: string | null;
  publicBaseUrl: string | null;
  totals: Record<UploadStatus, number>;
  bytes: number;
  entries: LegacyFileUploadEntry[];
}

function argValue(name: string): string | null {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
}

function hasArg(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function usage(): string {
  return [
    "Usage:",
    "  pnpm tsx src/scripts/migration/upload-legacy-file-export.ts \\",
    "    --manifest=/tmp/kiddzonl-legacy-file-export/manifest.json",
    "",
    "Options:",
    "  --manifest=<path>       Required export manifest from export-legacy-files.ts.",
    "  --package-dir=<path>    Export package directory. Defaults to manifest.outDir.",
    "  --out-manifest=<path>   Upload report path. Defaults to <package-dir>/upload-manifest.json.",
    "  --json=<path>           Alias for --out-manifest.",
    "  --rule=<rule-id>        Upload only one legacy file rule.",
    "  --dry-run               Validate package paths and object keys without uploading.",
    "  --overwrite             Replace existing local/S3/R2 objects.",
    "  --fail-on-warning       Exit non-zero on unsafe keys, missing package files, or upload errors.",
    "",
    "Storage env:",
    "  STORAGE_PROVIDER=local|s3|r2",
    "  STORAGE_LOCAL_ROOT=.storage/objects",
    "  STORAGE_BUCKET=<bucket>",
    "  STORAGE_ENDPOINT=<r2-or-s3-compatible-endpoint>",
    "  STORAGE_REGION=<region-or-auto>",
    "  STORAGE_ACCESS_KEY_ID=<key>",
    "  STORAGE_SECRET_ACCESS_KEY=<secret>",
    "  STORAGE_PUBLIC_BASE_URL=<cdn-or-public-base-url>",
    "  STORAGE_KEY_PREFIX=<optional-prefix>",
  ].join("\n");
}

function readManifest(manifestPath: string): LegacyFileExportManifest {
  const raw = fs.readFileSync(manifestPath, "utf8");
  const parsed = JSON.parse(raw) as LegacyFileExportManifest;
  if (!Array.isArray(parsed.entries)) {
    throw new Error(`Invalid legacy file export manifest: ${manifestPath}`);
  }
  return parsed;
}

function packagePathForEntry(
  packageDir: string,
  storageKey: string | null
): string | null {
  if (!storageKey) return null;
  const safeKey = normalizeStorageKey(storageKey);
  const fullPath = path.resolve(packageDir, safeKey);
  const root = path.resolve(packageDir);
  if (fullPath !== root && !fullPath.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Storage key resolves outside package dir: ${storageKey}`);
  }
  return fullPath;
}

function metadataForEntry(
  entry: LegacyFileExportEntry
): Record<string, string | number | null | undefined> {
  return {
    "source-database": entry.sourceDatabase,
    "rule-id": entry.ruleId,
    "legacy-table": entry.legacyTable,
    "legacy-column": entry.legacyColumn,
    "legacy-id": entry.legacyId,
    "owner-id": entry.ownerId,
    "modern-destination": entry.modernDestination,
  };
}

function emptyTotals(): Record<UploadStatus, number> {
  return {
    uploaded: 0,
    skipped: 0,
    "dry-run": 0,
    "not-exported": 0,
    "missing-package-file": 0,
    "unsafe-key": 0,
    error: 0,
  };
}

function uploadEntryBase(params: {
  entry: LegacyFileExportEntry;
  status: UploadStatus;
  config: ObjectStorageConfig;
  packagePath: string | null;
  objectKey: string | null;
  publicUrl: string | null;
  bytes: number | null;
  reason?: string;
}): LegacyFileUploadEntry {
  return {
    status: params.status,
    sourceDatabase: params.entry.sourceDatabase,
    ruleId: params.entry.ruleId,
    legacyTable: params.entry.legacyTable,
    legacyColumn: params.entry.legacyColumn,
    legacyId: params.entry.legacyId,
    ownerId: params.entry.ownerId,
    title: params.entry.title,
    active: params.entry.active,
    filename: params.entry.filename,
    exportStatus: params.entry.status,
    packagePath: params.packagePath,
    storageKey: params.entry.storageKey,
    objectKey: params.objectKey,
    publicUrl: params.publicUrl,
    bytes: params.bytes,
    provider: params.config.provider,
    bucket: params.config.bucket ?? null,
    modernDestination: params.entry.modernDestination,
    modernStorageKeyPrefix: params.entry.modernStorageKeyPrefix,
    reason: params.reason,
  };
}

async function uploadExportEntry(params: {
  entry: LegacyFileExportEntry;
  packageDir: string;
  config: ObjectStorageConfig;
  dryRun: boolean;
  overwrite: boolean;
}): Promise<LegacyFileUploadEntry> {
  const { entry, packageDir, config, dryRun, overwrite } = params;
  let packagePath: string | null = null;
  let objectKey: string | null = null;
  let publicUrl: string | null = null;

  try {
    if (entry.status !== "exported" || !entry.storageKey) {
      return uploadEntryBase({
        entry,
        status: "not-exported",
        config,
        packagePath,
        objectKey,
        publicUrl,
        bytes: null,
        reason: entry.reason || `Export status was ${entry.status}.`,
      });
    }

    packagePath = packagePathForEntry(packageDir, entry.storageKey);
    objectKey = objectKeyForStorageKey(entry.storageKey, config);
    publicUrl = publicUrlForObjectKey(objectKey, config);

    if (!packagePath || !fs.existsSync(packagePath)) {
      return uploadEntryBase({
        entry,
        status: "missing-package-file",
        config,
        packagePath,
        objectKey,
        publicUrl,
        bytes: null,
        reason: "Exported manifest entry is missing from the package directory.",
      });
    }

    const stat = fs.statSync(packagePath);
    if (!stat.isFile()) {
      return uploadEntryBase({
        entry,
        status: "missing-package-file",
        config,
        packagePath,
        objectKey,
        publicUrl,
        bytes: null,
        reason: "Package path is not a regular file.",
      });
    }

    if (dryRun) {
      return uploadEntryBase({
        entry,
        status: "dry-run",
        config,
        packagePath,
        objectKey,
        publicUrl,
        bytes: stat.size,
      });
    }

    const result = await putObjectFromFile({
      sourcePath: packagePath,
      key: entry.storageKey,
      contentType: contentTypeForFilename(entry.filename || entry.storageKey),
      metadata: metadataForEntry(entry),
      overwrite,
      config,
    });

    return uploadEntryBase({
      entry,
      status: result.status,
      config,
      packagePath,
      objectKey: result.key,
      publicUrl: result.publicUrl,
      bytes: result.bytes,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status: UploadStatus = message.includes("Unsafe object key")
      ? "unsafe-key"
      : "error";
    return uploadEntryBase({
      entry,
      status,
      config,
      packagePath,
      objectKey,
      publicUrl,
      bytes: null,
      reason: message,
    });
  }
}

async function uploadLegacyFileExport(): Promise<LegacyFileUploadManifest> {
  if (hasArg("help") || hasArg("h")) {
    console.log(usage());
    process.exit(0);
  }

  const manifestArg = argValue("manifest");
  if (!manifestArg) {
    throw new Error(`--manifest is required.\n\n${usage()}`);
  }

  const manifestPath = path.resolve(manifestArg);
  const exportManifest = readManifest(manifestPath);
  const packageDir = path.resolve(
    argValue("package-dir") ||
      exportManifest.outDir ||
      path.dirname(manifestPath)
  );
  const outManifest = path.resolve(
    argValue("out-manifest") ||
      argValue("json") ||
      path.join(packageDir, "upload-manifest.json")
  );
  const onlyRule = argValue("rule");
  const dryRun = hasArg("dry-run");
  const overwrite = hasArg("overwrite");
  const failOnWarning = hasArg("fail-on-warning");
  const config = getObjectStorageConfig();

  const entries = onlyRule
    ? exportManifest.entries.filter((entry) => entry.ruleId === onlyRule)
    : exportManifest.entries;

  if (onlyRule && entries.length === 0) {
    throw new Error(`No export manifest entries found for rule: ${onlyRule}`);
  }

  log(
    `${dryRun ? "Validating" : "Uploading"} ${entries.length} legacy file manifest entries`
  );
  log(`Source manifest: ${manifestPath}`);
  log(`Package directory: ${packageDir}`);
  log(`Storage provider: ${config.provider}`);
  if (config.bucket) log(`Storage bucket: ${config.bucket}`);
  if (config.keyPrefix) log(`Storage key prefix: ${config.keyPrefix}`);
  if (!config.publicBaseUrl && config.provider !== "local") {
    log("STORAGE_PUBLIC_BASE_URL is not set; upload manifest publicUrl values will be null.");
  }

  const uploadEntries: LegacyFileUploadEntry[] = [];
  const totals = emptyTotals();
  let bytes = 0;

  for (const entry of entries) {
    const result = await uploadExportEntry({
      entry,
      packageDir,
      config,
      dryRun,
      overwrite,
    });
    uploadEntries.push(result);
    totals[result.status]++;
    bytes += result.bytes ?? 0;
  }

  const manifest: LegacyFileUploadManifest = {
    generatedAt: new Date().toISOString(),
    sourceManifest: manifestPath,
    sourceManifestGeneratedAt: exportManifest.generatedAt,
    sourceDatabase: exportManifest.sourceDatabase,
    packageDir,
    dryRun,
    overwrite,
    provider: config.provider,
    bucket: config.bucket ?? null,
    endpoint: config.endpoint ?? null,
    localRoot: config.localRoot ?? null,
    keyPrefix: config.keyPrefix ?? null,
    publicBaseUrl: config.publicBaseUrl ?? null,
    totals,
    bytes,
    entries: uploadEntries,
  };

  fs.mkdirSync(path.dirname(outManifest), { recursive: true });
  fs.writeFileSync(outManifest, `${JSON.stringify(manifest, null, 2)}\n`);
  log(`Wrote legacy file upload manifest to ${outManifest}`);
  log(
    `Legacy file upload totals: ${totals.uploaded} uploaded, ` +
      `${totals.skipped} skipped, ${totals["dry-run"]} dry-run, ` +
      `${totals["missing-package-file"]} missing package files, ` +
      `${totals["unsafe-key"]} unsafe keys, ${totals.error} errors, ` +
      `${totals["not-exported"]} not exported`
  );

  if (
    failOnWarning &&
    (totals["missing-package-file"] > 0 ||
      totals["unsafe-key"] > 0 ||
      totals.error > 0)
  ) {
    throw new Error("Legacy file upload warnings found.");
  }

  return manifest;
}

if (require.main === module) {
  uploadLegacyFileExport().catch((err) => {
    logError("Legacy file upload failed", err);
    process.exit(1);
  });
}
