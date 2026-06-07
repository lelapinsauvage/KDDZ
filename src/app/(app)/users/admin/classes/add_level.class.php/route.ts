import { requireRole } from "@/lib/require-role";
import {
  fieldValue,
  hasLegacyFlag,
  isLegacyLevelNameAvailable,
  legacyBooleanResponse,
  readLegacyValidationFields,
} from "@/lib/legacy-auth-remote-validation";

async function handleLegacyAddLevelValidation(request: Request) {
  try {
    await requireRole("ADMIN");
  } catch {
    return legacyBooleanResponse(false, 403);
  }

  const fields = await readLegacyValidationFields(request);
  if (!hasLegacyFlag(fields, "checklevel")) {
    return legacyBooleanResponse(false, 400);
  }

  return legacyBooleanResponse(
    await isLegacyLevelNameAvailable({
      levelName: fieldValue(fields, "level"),
      sourceDatabase: fieldValue(
        fields,
        "sourceDatabase",
        "source_database",
        "db",
      ),
      levelRecordType: fieldValue(
        fields,
        "levelRecordType",
        "level_record_type",
        "recordType",
        "record_type",
        "table",
      ),
    }),
  );
}

export async function GET(request: Request) {
  return handleLegacyAddLevelValidation(request);
}

export async function POST(request: Request) {
  return handleLegacyAddLevelValidation(request);
}
