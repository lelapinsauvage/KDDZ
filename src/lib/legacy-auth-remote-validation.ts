import { db } from "@/lib/db";

type LegacyRemoteUserRecordType = "login_user" | "manager_login_user";
type LegacyRemoteLevelRecordType = "login_level" | "manager_login_level";

export type LegacyValidationFields = Record<string, string>;

function firstString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function assignSearchParams(
  fields: LegacyValidationFields,
  params: URLSearchParams,
) {
  for (const [key, value] of params.entries()) {
    fields[key] = value.trim();
  }
}

export async function readLegacyValidationFields(request: Request) {
  const fields: LegacyValidationFields = {};
  const url = new URL(request.url);
  assignSearchParams(fields, url.searchParams);

  if (request.method === "GET" || request.method === "HEAD") {
    return fields;
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await request.formData().catch(() => null);
    if (!form) return fields;

    for (const key of form.keys()) {
      fields[key] = firstString(form.get(key));
    }
    return fields;
  }

  const text = await request.text().catch(() => "");
  if (text.trim()) {
    assignSearchParams(fields, new URLSearchParams(text));
  }
  return fields;
}

export function fieldValue(
  fields: LegacyValidationFields,
  ...keys: string[]
) {
  for (const key of keys) {
    const value = fields[key]?.trim();
    if (value) return value;
  }
  return "";
}

export function hasLegacyFlag(fields: LegacyValidationFields, key: string) {
  const value = fields[key]?.trim().toLowerCase();
  return Boolean(value && value !== "0" && value !== "false");
}

function normalizeUserRecordType(
  value: string | null | undefined,
): LegacyRemoteUserRecordType {
  const normalized = value?.trim().toLowerCase();
  if (
    normalized === "manager_login_user" ||
    normalized === "login_users_man" ||
    normalized === "manager"
  ) {
    return "manager_login_user";
  }
  return "login_user";
}

function normalizeLevelRecordType(
  value: string | null | undefined,
): LegacyRemoteLevelRecordType {
  const normalized = value?.trim().toLowerCase();
  if (
    normalized === "manager_login_level" ||
    normalized === "login_levels_man" ||
    normalized === "manager"
  ) {
    return "manager_login_level";
  }
  return "login_level";
}

async function resolveSourceDatabase(
  recordType: LegacyRemoteUserRecordType | LegacyRemoteLevelRecordType,
  requestedSourceDatabase: string | null | undefined,
) {
  const sourceDatabase = requestedSourceDatabase?.trim();
  if (sourceDatabase) return sourceDatabase;

  const firstSource = await db.legacyAuthRecord.findFirst({
    where: { recordType },
    orderBy: [{ sourceDatabase: "asc" }, { legacyId: "asc" }],
    select: { sourceDatabase: true },
  });

  return firstSource?.sourceDatabase ?? null;
}

function equalsInsensitive(value: string) {
  return { equals: value, mode: "insensitive" as const };
}

export async function isLegacyUsernameAvailable(input: {
  username: string;
  sourceDatabase?: string | null;
  recordType?: string | null;
}) {
  const username = input.username.trim();
  if (!username) return false;

  const recordType = normalizeUserRecordType(input.recordType);
  const sourceDatabase = await resolveSourceDatabase(
    recordType,
    input.sourceDatabase,
  );
  if (!sourceDatabase) return true;

  const existing = await db.legacyAuthRecord.findFirst({
    where: {
      sourceDatabase,
      recordType,
      OR: [
        { username: equalsInsensitive(username) },
        { recordKey: equalsInsensitive(username) },
      ],
    },
    select: { id: true },
  });

  return !existing;
}

export async function isLegacyEmailAvailable(input: {
  email: string;
  sourceDatabase?: string | null;
  recordType?: string | null;
}) {
  const email = input.email.trim();
  if (!email) return false;

  const recordType = normalizeUserRecordType(input.recordType);
  const sourceDatabase = await resolveSourceDatabase(
    recordType,
    input.sourceDatabase,
  );
  if (!sourceDatabase) return true;

  const existing = await db.legacyAuthRecord.findFirst({
    where: {
      sourceDatabase,
      recordType,
      email: equalsInsensitive(email),
    },
    select: { id: true },
  });

  return !existing;
}

export async function isLegacyLevelNameAvailable(input: {
  levelName: string;
  sourceDatabase?: string | null;
  levelRecordType?: string | null;
}) {
  const levelName = input.levelName.trim();
  if (!levelName) return false;

  const recordType = normalizeLevelRecordType(input.levelRecordType);
  const sourceDatabase = await resolveSourceDatabase(
    recordType,
    input.sourceDatabase,
  );
  if (!sourceDatabase) return true;

  const existing = await db.legacyAuthRecord.findFirst({
    where: {
      sourceDatabase,
      recordType,
      recordKey: equalsInsensitive(levelName),
    },
    select: { id: true },
  });

  return !existing;
}

export function legacyBooleanResponse(value: boolean, status = 200) {
  return new Response(value ? "true" : "false", {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
