import { db } from "@/lib/db";

type LegacyRemoteUserRecordType = "login_user" | "manager_login_user";
type LegacyRemoteLevelRecordType = "login_level" | "manager_login_level";

export type LegacyValidationFields = Record<string, string>;

type LegacySuggestion = {
  id: number;
  label: string;
};

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

function legacyObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function legacyString(value: unknown, key: string) {
  const raw = legacyObject(value)[key];
  if (typeof raw === "string") return raw;
  if (typeof raw === "number") return String(raw);
  return "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function legacyHtmlResponse(html: string, status = 200) {
  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function suggestionsHtml(params: {
  suggestions: LegacySuggestion[];
  emptyHelp: string;
  href: (suggestion: LegacySuggestion) => string;
}) {
  if (params.suggestions.length < 1) {
    return `<h5>No suggestions</h5>
				  <p class="help-block">${escapeHtml(params.emptyHelp)}</p>`;
  }

  return [
    "<h5>Suggestions</h5>",
    ...params.suggestions.map(
      (suggestion) =>
        `<p><a href='${escapeHtml(params.href(suggestion))}'>${escapeHtml(
          suggestion.label,
        )}</a></p>`,
    ),
  ].join("\n");
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

export async function getLegacyUserSuggestions(input: {
  search: string;
  sourceDatabase?: string | null;
  recordType?: string | null;
}) {
  const search = input.search.trim();
  if (!search) return [];

  const recordType = normalizeUserRecordType(input.recordType);
  const sourceDatabase = await resolveSourceDatabase(
    recordType,
    input.sourceDatabase,
  );
  if (!sourceDatabase) return [];

  const query = search.toLowerCase();
  const records = await db.legacyAuthRecord.findMany({
    where: {
      sourceDatabase,
      recordType,
    },
    orderBy: [{ username: "asc" }, { legacyId: "asc" }],
    select: {
      legacyId: true,
      legacyUserId: true,
      username: true,
      recordKey: true,
      legacyData: true,
    },
  });

  return records
    .map((record) => {
      const id = record.legacyUserId ?? record.legacyId;
      const username =
        record.username ??
        record.recordKey ??
        legacyString(record.legacyData, "username");
      return {
        id,
        label: username,
        name: legacyString(record.legacyData, "name"),
      };
    })
    .filter((record) => {
      const username = record.label.toLowerCase();
      const name = record.name.toLowerCase();
      const id = String(record.id).toLowerCase();
      return (
        username.startsWith(query) ||
        name.startsWith(query) ||
        id.startsWith(query)
      );
    })
    .slice(0, 5)
    .map(({ id, label }) => ({ id, label }));
}

export async function getLegacyLevelSuggestions(input: {
  search: string;
  sourceDatabase?: string | null;
  levelRecordType?: string | null;
}) {
  const search = input.search.trim();
  if (!search) return [];

  const recordType = normalizeLevelRecordType(input.levelRecordType);
  const sourceDatabase = await resolveSourceDatabase(
    recordType,
    input.sourceDatabase,
  );
  if (!sourceDatabase) return [];

  const query = search.toLowerCase();
  const records = await db.legacyAuthRecord.findMany({
    where: {
      sourceDatabase,
      recordType,
    },
    orderBy: [{ recordKey: "asc" }, { legacyId: "asc" }],
    select: {
      legacyId: true,
      recordKey: true,
      redirect: true,
      legacyData: true,
    },
  });

  return records
    .map((record) => {
      const label =
        record.recordKey || legacyString(record.legacyData, "level_name");
      const redirect = record.redirect ?? legacyString(record.legacyData, "redirect");
      return {
        id: record.legacyId,
        label: label || `Level ${record.legacyId}`,
        redirect,
      };
    })
    .filter((record) => {
      const label = record.label.toLowerCase();
      const redirect = record.redirect.toLowerCase();
      return label.startsWith(query) || redirect.includes(query);
    })
    .slice(0, 5)
    .map(({ id, label }) => ({ id, label }));
}

export function legacyUserSuggestionsResponse(suggestions: LegacySuggestion[]) {
  return legacyHtmlResponse(
    suggestionsHtml({
      suggestions,
      emptyHelp: "Try searching by username, name, or user id.",
      href: (suggestion) => `users.php?uid=${suggestion.id}`,
    }),
  );
}

export function legacyLevelSuggestionsResponse(suggestions: LegacySuggestion[]) {
  return legacyHtmlResponse(
    suggestionsHtml({
      suggestions,
      emptyHelp: "Try searching by name, level, or redirect url.",
      href: (suggestion) => `levels.php?lid=${suggestion.id}`,
    }),
  );
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
