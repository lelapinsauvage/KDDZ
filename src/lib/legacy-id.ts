import { createCipheriv, createDecipheriv, createHash } from "crypto";

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function decodeMaybeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parsePositiveInt(value: string) {
  if (!/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function decryptLegacyNumericId(value: string) {
  try {
    const outerDecoded = Buffer.from(value, "base64").toString("utf8");
    if (!outerDecoded) return null;

    const { key, iv } = legacyCipherMaterial();
    const decipher = createDecipheriv("aes-256-cbc", key, iv);
    const decrypted =
      decipher.update(outerDecoded, "base64", "utf8") + decipher.final("utf8");

    return parsePositiveInt(decrypted);
  } catch {
    return null;
  }
}

function legacyCipherMaterial() {
  const keyHash = createHash("sha256").update("LeBarbarGard").digest("hex");
  return {
    key: Buffer.from(keyHash).subarray(0, 32),
    iv: Buffer.from(keyHash.slice(0, 16)),
  };
}

export function encryptLegacyId(value: string | number) {
  const { key, iv } = legacyCipherMaterial();
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  const encrypted =
    cipher.update(String(value), "utf8", "base64") + cipher.final("base64");
  return Buffer.from(encrypted, "utf8").toString("base64");
}

export function legacyNumericCandidates(value?: string | null) {
  const values = new Set<string>();
  if (value?.trim()) {
    const raw = value.trim();
    const decoded = decodeMaybeURIComponent(raw).trim();
    values.add(raw);
    values.add(decoded);
    values.add(raw.replaceAll(" ", "+"));
    values.add(decoded.replaceAll(" ", "+"));
  }

  const ids = new Set<number>();
  for (const candidate of values) {
    const direct = parsePositiveInt(candidate);
    if (direct) ids.add(direct);

    const decrypted = decryptLegacyNumericId(candidate);
    if (decrypted) ids.add(decrypted);
  }

  return Array.from(ids);
}
