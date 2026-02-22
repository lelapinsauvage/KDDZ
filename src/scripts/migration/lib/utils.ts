import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// ID Mapping — tracks old integer IDs → new UUIDs for FK resolution
// ---------------------------------------------------------------------------
const idMaps = new Map<string, Map<number | string, string>>();

export function getIdMap(table: string): Map<number | string, string> {
  if (!idMaps.has(table)) {
    idMaps.set(table, new Map());
  }
  return idMaps.get(table)!;
}

export function setMapping(
  table: string,
  oldId: number | string,
  newId: string
) {
  getIdMap(table).set(Number(oldId), newId);
}

export function getMapping(
  table: string,
  oldId: number | string | null | undefined
): string | null {
  if (oldId == null || oldId === "" || oldId === "0" || oldId === 0)
    return null;
  return getIdMap(table).get(Number(oldId)) ?? null;
}

export function requireMapping(
  table: string,
  oldId: number | string
): string {
  const id = getMapping(table, oldId);
  if (!id) {
    throw new Error(`Missing mapping for ${table}:${oldId}`);
  }
  return id;
}

export function generateUUID(): string {
  return randomUUID();
}

// ---------------------------------------------------------------------------
// Date parsing — old DB stores dates as varchar in many formats
// ---------------------------------------------------------------------------

/**
 * Parse a date string from the old MySQL DB into a JS Date or null.
 * Handles: "YYYY-MM-DD", "DD/MM/YYYY", "DD-MM-YYYY", "YYYY/MM/DD",
 * empty strings, "0000-00-00", and MySQL DATETIME strings.
 */
export function parseDate(val: string | null | undefined): Date | null {
  if (!val || val.trim() === "" || val === "0000-00-00" || val === "0") {
    return null;
  }
  const trimmed = val.trim();

  // Already a valid ISO-ish format (YYYY-MM-DD or YYYY-MM-DD HH:mm:ss)
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const d = new Date(`${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`);
    return isNaN(d.getTime()) ? null : d;
  }

  // YYYY/MM/DD
  const ymd = trimmed.match(/^(\d{4})[/](\d{1,2})[/](\d{1,2})$/);
  if (ymd) {
    const d = new Date(`${ymd[1]}-${ymd[2].padStart(2, "0")}-${ymd[3].padStart(2, "0")}`);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/**
 * Parse a time string (HH:mm or HH:mm:ss) into a Date set on the Unix epoch
 * day (1970-01-01) so Prisma can store it as @db.Time(6).
 */
export function parseTime(val: string | null | undefined): Date | null {
  if (!val || val.trim() === "" || val === "0") return null;
  const trimmed = val.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const s = match[3] ? parseInt(match[3], 10) : 0;
  if (h > 23 || m > 59 || s > 59) return null;
  return new Date(`1970-01-01T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.000Z`);
}

// ---------------------------------------------------------------------------
// Enum mapping helpers
// ---------------------------------------------------------------------------
export function mapGender(val: string | null | undefined): "MALE" | "FEMALE" | null {
  if (!val) return null;
  const v = val.toLowerCase().trim();
  if (v === "male" || v === "m" || v === "boy") return "MALE";
  if (v === "female" || v === "f" || v === "girl") return "FEMALE";
  return null;
}

export function mapPaymentMethod(
  val: string | null | undefined
): "CASH" | "CHECK" | "TRANSFER" | "CREDIT_CARD" {
  if (!val) return "CASH";
  const v = val.toLowerCase().trim();
  if (v === "check" || v === "cheque") return "CHECK";
  if (v === "creditcard" || v === "credit card" || v === "credit_card")
    return "CREDIT_CARD";
  if (v === "bank" || v === "transfer") return "TRANSFER";
  return "CASH";
}

export function mapPaymentCategory(
  val: string | null | undefined
): "REGISTRATION" | "MONTHLY" | "BUS" | "XTRA_TIME" | "FOOD" | "OTHER" {
  if (!val) return "OTHER";
  const v = val.toLowerCase().trim();
  if (v === "monthly" || v === "1") return "MONTHLY";
  if (v === "reg" || v === "registration" || v === "2") return "REGISTRATION";
  if (v === "bus" || v === "3") return "BUS";
  if (v === "xtra" || v === "xtra_time" || v === "4") return "XTRA_TIME";
  if (v === "food" || v === "5") return "FOOD";
  return "OTHER";
}

export function mapPortionSize(
  val: string | null | undefined
): "NONE" | "LITTLE" | "HALF" | "MOST" | "ALL" | null {
  if (!val || val.trim() === "") return null;
  const v = val.toLowerCase().trim();
  if (v === "none" || v === "0") return "NONE";
  if (v === "little" || v === "1") return "LITTLE";
  if (v === "half" || v === "2") return "HALF";
  if (v === "most" || v === "3") return "MOST";
  if (v === "all" || v === "4") return "ALL";
  return null;
}

// ---------------------------------------------------------------------------
// String / value helpers
// ---------------------------------------------------------------------------
export function cleanString(val: unknown): string | null {
  if (val == null) return null;
  const s = String(val).trim();
  return s === "" || s === "0" ? null : s;
}

export function toBool(val: unknown): boolean {
  if (val == null) return false;
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  const s = String(val).toLowerCase().trim();
  return s === "1" || s === "true" || s === "yes";
}

export function toInt(val: unknown, fallback = 0): number {
  if (val == null) return fallback;
  const n = parseInt(String(val), 10);
  return isNaN(n) ? fallback : n;
}

export function toFloat(val: unknown, fallback = 0): number {
  if (val == null) return fallback;
  const n = parseFloat(String(val));
  return isNaN(n) ? fallback : n;
}

// ---------------------------------------------------------------------------
// CLI helpers
// ---------------------------------------------------------------------------
export function isDryRun(): boolean {
  return process.argv.includes("--dry-run");
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------
export function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

export function logError(msg: string, err?: unknown) {
  console.error(`[${new Date().toISOString()}] ERROR: ${msg}`);
  if (err instanceof Error) {
    console.error(`  ${err.message}`);
  }
}

export function logProgress(current: number, total: number, label: string) {
  if (current % 50 === 0 || current === total) {
    log(`  ${label}: ${current}/${total}`);
  }
}
