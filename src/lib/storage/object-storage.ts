import fs from "fs";
import path from "path";

import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type ObjectStorageProvider = "local" | "s3" | "r2";

export interface ObjectStorageConfig {
  provider: ObjectStorageProvider;
  bucket?: string;
  region: string;
  endpoint?: string;
  forcePathStyle: boolean;
  localRoot?: string;
  publicBaseUrl?: string;
  keyPrefix?: string;
}

export interface StoredObjectResult {
  provider: ObjectStorageProvider;
  bucket?: string;
  key: string;
  publicUrl: string | null;
  bytes: number;
  status: "uploaded" | "skipped";
}

export interface PutObjectFromFileOptions {
  sourcePath: string;
  key: string;
  contentType?: string;
  metadata?: Record<string, string | number | null | undefined>;
  overwrite?: boolean;
  config?: ObjectStorageConfig;
}

export interface PresignedUploadOptions {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
  metadata?: Record<string, string | number | null | undefined>;
  config?: ObjectStorageConfig;
}

function envValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function boolEnv(name: string, fallback: boolean): boolean {
  const value = envValue(name);
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function objectKeyPath(key: string): string {
  if (
    key.includes("\0") ||
    key.includes("\\") ||
    path.isAbsolute(key)
  ) {
    throw new Error(`Unsafe object key: ${key}`);
  }

  const parts = key.split("/");
  if (
    parts.length === 0 ||
    parts.some((part) => part === "" || part === "." || part === "..")
  ) {
    throw new Error(`Unsafe object key: ${key}`);
  }

  return parts.join("/");
}

function normalizeKeyPrefix(prefix: string | undefined): string | undefined {
  if (!prefix) return undefined;
  const trimmed = prefix.replace(/^\/+|\/+$/g, "");
  return trimmed ? objectKeyPath(trimmed) : undefined;
}

export function normalizeStorageKey(key: string): string {
  return objectKeyPath(key.trim());
}

export function objectKeyForStorageKey(
  storageKey: string,
  config = getObjectStorageConfig()
): string {
  const key = normalizeStorageKey(storageKey);
  return config.keyPrefix ? `${config.keyPrefix}/${key}` : key;
}

export function contentTypeForFilename(filename: string | null | undefined): string {
  const ext = path.extname(filename || "").toLowerCase();
  const types: Record<string, string> = {
    ".bmp": "image/bmp",
    ".gif": "image/gif",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".webp": "image/webp",
  };
  return types[ext] || "application/octet-stream";
}

export function publicUrlForObjectKey(
  key: string,
  config = getObjectStorageConfig()
): string | null {
  const baseUrl = config.publicBaseUrl?.replace(/\/+$/g, "");
  if (!baseUrl) return null;
  const encodedKey = normalizeStorageKey(key)
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `${baseUrl}/${encodedKey}`;
}

export function getObjectStorageConfig(): ObjectStorageConfig {
  const rawProvider = (envValue("STORAGE_PROVIDER") || "local").toLowerCase();
  if (!["local", "s3", "r2"].includes(rawProvider)) {
    throw new Error(
      `Unsupported STORAGE_PROVIDER "${rawProvider}". Use local, s3, or r2.`
    );
  }

  const provider = rawProvider as ObjectStorageProvider;
  const endpoint = envValue("STORAGE_ENDPOINT");
  const bucket = envValue("STORAGE_BUCKET");
  const publicBaseUrl = envValue("STORAGE_PUBLIC_BASE_URL");
  const keyPrefix = normalizeKeyPrefix(envValue("STORAGE_KEY_PREFIX"));
  const region =
    envValue("STORAGE_REGION") || (provider === "r2" ? "auto" : "us-east-1");

  if ((provider === "s3" || provider === "r2") && !bucket) {
    throw new Error("STORAGE_BUCKET is required for s3/r2 storage.");
  }

  if (provider === "r2" && !endpoint) {
    throw new Error("STORAGE_ENDPOINT is required for Cloudflare R2 storage.");
  }

  if (provider === "s3" || provider === "r2") {
    if (!envValue("STORAGE_ACCESS_KEY_ID")) {
      throw new Error("STORAGE_ACCESS_KEY_ID is required for s3/r2 storage.");
    }
    if (!envValue("STORAGE_SECRET_ACCESS_KEY")) {
      throw new Error("STORAGE_SECRET_ACCESS_KEY is required for s3/r2 storage.");
    }
  }

  return {
    provider,
    bucket,
    endpoint,
    region,
    forcePathStyle: boolEnv(
      "STORAGE_FORCE_PATH_STYLE",
      provider === "r2" || Boolean(endpoint)
    ),
    localRoot:
      provider === "local"
        ? path.resolve(envValue("STORAGE_LOCAL_ROOT") || ".storage/objects")
        : undefined,
    publicBaseUrl: publicBaseUrl || (provider === "local" ? "/storage" : undefined),
    keyPrefix,
  };
}

export function resolveLocalObjectPath(
  key: string,
  config = getObjectStorageConfig()
): string {
  if (config.provider !== "local" || !config.localRoot) {
    throw new Error("resolveLocalObjectPath requires STORAGE_PROVIDER=local.");
  }

  const root = path.resolve(config.localRoot);
  const fullPath = path.resolve(root, normalizeStorageKey(key));
  if (fullPath !== root && !fullPath.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Object key resolves outside local root: ${key}`);
  }
  return fullPath;
}

function cleanMetadata(
  metadata: Record<string, string | number | null | undefined> | undefined
): Record<string, string> | undefined {
  if (!metadata) return undefined;
  const cleaned: Record<string, string> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value == null || value === "") continue;
    cleaned[key] = String(value);
  }
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

function s3Client(config: ObjectStorageConfig): S3Client {
  if (config.provider !== "s3" && config.provider !== "r2") {
    throw new Error("S3 client requires STORAGE_PROVIDER=s3 or r2.");
  }

  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: envValue("STORAGE_ACCESS_KEY_ID")!,
      secretAccessKey: envValue("STORAGE_SECRET_ACCESS_KEY")!,
    },
  });
}

function isMissingObjectError(err: unknown): boolean {
  if (err instanceof Error && ["NotFound", "NoSuchKey"].includes(err.name)) {
    return true;
  }
  if (typeof err === "object" && err !== null && "$metadata" in err) {
    const metadata = (err as { $metadata?: { httpStatusCode?: number } })
      .$metadata;
    return metadata?.httpStatusCode === 404;
  }
  return false;
}

async function objectExistsInS3(
  client: S3Client,
  bucket: string,
  key: string
): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (err) {
    if (isMissingObjectError(err)) return false;
    throw err;
  }
}

export async function putObjectFromFile(
  options: PutObjectFromFileOptions
): Promise<StoredObjectResult> {
  const config = options.config || getObjectStorageConfig();
  const key = objectKeyForStorageKey(options.key, config);
  const stat = fs.statSync(options.sourcePath);

  if (config.provider === "local") {
    const targetPath = resolveLocalObjectPath(key, config);
    if (!options.overwrite && fs.existsSync(targetPath)) {
      const existing = fs.statSync(targetPath);
      return {
        provider: config.provider,
        key,
        publicUrl: publicUrlForObjectKey(key, config),
        bytes: existing.size,
        status: "skipped",
      };
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(options.sourcePath, targetPath);
    return {
      provider: config.provider,
      key,
      publicUrl: publicUrlForObjectKey(key, config),
      bytes: stat.size,
      status: "uploaded",
    };
  }

  const bucket = config.bucket;
  if (!bucket) throw new Error("STORAGE_BUCKET is required for s3/r2 uploads.");

  const client = s3Client(config);
  if (!options.overwrite && (await objectExistsInS3(client, bucket, key))) {
    return {
      provider: config.provider,
      bucket,
      key,
      publicUrl: publicUrlForObjectKey(key, config),
      bytes: stat.size,
      status: "skipped",
    };
  }

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fs.createReadStream(options.sourcePath),
      ContentType: options.contentType,
      Metadata: cleanMetadata(options.metadata),
    })
  );

  return {
    provider: config.provider,
    bucket,
    key,
    publicUrl: publicUrlForObjectKey(key, config),
    bytes: stat.size,
    status: "uploaded",
  };
}

export async function createPresignedUploadUrl(
  options: PresignedUploadOptions
): Promise<{ url: string; key: string; publicUrl: string | null; expiresAt: Date }> {
  const config = options.config || getObjectStorageConfig();
  if (config.provider === "local") {
    throw new Error("Presigned uploads require STORAGE_PROVIDER=s3 or r2.");
  }

  const bucket = config.bucket;
  if (!bucket) throw new Error("STORAGE_BUCKET is required for presigned uploads.");

  const key = objectKeyForStorageKey(options.key, config);
  const expiresInSeconds = options.expiresInSeconds ?? 900;
  const client = s3Client(config);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: options.contentType,
    Metadata: cleanMetadata(options.metadata),
  });

  return {
    url: await getSignedUrl(client, command, { expiresIn: expiresInSeconds }),
    key,
    publicUrl: publicUrlForObjectKey(key, config),
    expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
  };
}
