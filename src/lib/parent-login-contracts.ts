const LEGACY_PARENT_REPORT_URL =
  "https://kiddzonline.com/Garderie_parent/Front/templates/admin/users/login.php";

export type LegacyParentLoginResponse = {
  id: string | number;
  usites: string | number;
  status: boolean;
  fname: string;
  lname: string;
  url: string;
  urlLabel: string;
  feedback: string;
  token?: string;
  childId?: string;
  modernParentUserId?: string;
};

export function buildFailedLegacyParentLogin(feedback = "") {
  return {
    id: 0,
    usites: 0,
    status: false,
    fname: "",
    lname: "",
    url: "",
    urlLabel: "View Full Reports",
    feedback,
    token: "",
    childId: "",
  } satisfies LegacyParentLoginResponse;
}

export function buildSuccessfulLegacyParentLogin(params: {
  id: unknown;
  usites: unknown;
  fname: unknown;
  lname: unknown;
  token: string;
  childId: string;
  modernParentUserId: string;
}) {
  return {
    id: toLegacyId(params.id),
    usites: toLegacyId(params.usites),
    status: true,
    fname: toLegacyString(params.fname),
    lname: toLegacyString(params.lname),
    url: params.token
      ? `${LEGACY_PARENT_REPORT_URL}?token=${encodeURIComponent(params.token)}`
      : "",
    urlLabel: "View Full Reports",
    feedback: "",
    token: params.token,
    childId: params.childId,
    modernParentUserId: params.modernParentUserId,
  } satisfies LegacyParentLoginResponse;
}

function toLegacyId(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const stringValue = toLegacyString(value).trim();
  if (/^\d+$/.test(stringValue)) return Number(stringValue);
  return stringValue || 0;
}

function toLegacyString(value: unknown) {
  if (value === undefined || value === null) return "";
  return String(value);
}
