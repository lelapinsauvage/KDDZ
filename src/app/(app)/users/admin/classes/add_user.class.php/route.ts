import { requireLegacyAdminPanelAccess } from "@/lib/legacy-system-action-permissions";
import {
  fieldValue,
  getLegacyUserSuggestions,
  hasLegacyFlag,
  isLegacyEmailAvailable,
  isLegacyUsernameAvailable,
  legacyBooleanResponse,
  legacyUserSuggestionsResponse,
  readLegacyValidationFields,
} from "@/lib/legacy-auth-remote-validation";

async function handleLegacyAddUserValidation(request: Request) {
  try {
    await requireLegacyAdminPanelAccess();
  } catch {
    return legacyBooleanResponse(false, 403);
  }

  const fields = await readLegacyValidationFields(request);
  const sourceDatabase = fieldValue(
    fields,
    "sourceDatabase",
    "source_database",
    "db",
  );
  const recordType = fieldValue(fields, "recordType", "record_type", "table");

  if (fieldValue(fields, "searchUsers")) {
    return legacyUserSuggestionsResponse(
      await getLegacyUserSuggestions({
        search: fieldValue(fields, "searchUsers"),
        sourceDatabase,
        recordType,
      }),
    );
  }

  if (hasLegacyFlag(fields, "checkusername")) {
    return legacyBooleanResponse(
      await isLegacyUsernameAvailable({
        username: fieldValue(fields, "username"),
        sourceDatabase,
        recordType,
      }),
    );
  }

  if (hasLegacyFlag(fields, "checkemail")) {
    return legacyBooleanResponse(
      await isLegacyEmailAvailable({
        email: fieldValue(fields, "email"),
        sourceDatabase,
        recordType,
      }),
    );
  }

  return legacyBooleanResponse(false, 400);
}

export async function GET(request: Request) {
  return handleLegacyAddUserValidation(request);
}

export async function POST(request: Request) {
  return handleLegacyAddUserValidation(request);
}
