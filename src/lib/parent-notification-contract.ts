export type ParentNotificationDetail = {
  subject: string;
  body: string;
  datetime: string;
};

export type ParentNotificationGroup = {
  name: string;
  details: ParentNotificationDetail[];
};

export type ParentNotificationNature = {
  legacyId: number;
  name: string;
  contentTable: string | null;
  parentDeliveryTable: string | null;
  subjectColumn: string | null;
  bodyColumn: string | null;
  displayOrder: number | null;
  isActive: boolean;
};

export type ParentNotificationPayload = Record<string, unknown> & {
  info: {
    name: string;
    status: boolean;
    no_notifications: string;
  };
};

export const LEGACY_NOTIFICATION_GROUP_COUNT = 11;

export const DEFAULT_NATURES: ParentNotificationNature[] = [
  nature(1, "Birthdays", "custom_notifications_birthday_parents", null, "", "cusntf_notification_text"),
  nature(2, "Closure", "t_alarms", "custom_notifications_parents", "type", "details"),
  nature(4, "Events", "t_events", "custom_notifications_events_parents", "custom_subject", "custom_body"),
  nature(7, "Medicine", "t_alarms_medicine", "custom_notifications_medicine_parents", "", "details"),
  nature(3, "Assessments", "t_alarms_assessment_parents", null, "", "details"),
  nature(5, "Report Reminders", "t_alarms_medical", "custom_notifications_medical_parents", "", "details"),
  nature(6, "Vaccinations", "t_alarms_vaccinations", "custom_notifications_vaccinations", "", "details"),
  nature(8, "Insurance", "t_alarms_insurance", "custom_notifications_insurance_parents", "", "details"),
  nature(9, "Payments", "t_alarms_payments", "custom_notifications_payments", "", "details"),
  nature(10, "Other", "t_alarms_others", "custom_notifications_others_parents", "", "details"),
  nature(11, "Requests", "t_alarms_requests", "custom_notifications_requests_parents", "", "details"),
];

export function buildEmptyNotificationPayload(): ParentNotificationPayload {
  const result: ParentNotificationPayload = {
    info: {
      name: "",
      status: false,
      no_notifications: "No New Notifications",
    },
  };

  DEFAULT_NATURES.forEach((item, index) => {
    result[`notification${index + 1}`] = buildNotificationGroup(item.name, []);
  });

  return result;
}

export function buildNotificationGroup(
  name: unknown,
  details: Array<Partial<Record<keyof ParentNotificationDetail, unknown>>> = []
): ParentNotificationGroup {
  return {
    name: toNotificationString(name),
    details: details.map(buildNotificationDetail),
  };
}

export function withDefaultNotificationNatures(
  natures: ParentNotificationNature[]
): ParentNotificationNature[] {
  if (natures.length >= LEGACY_NOTIFICATION_GROUP_COUNT) return natures;

  const existingKeys = new Set(
    natures.map((item) => `${item.legacyId}:${item.name.toLowerCase()}`)
  );
  const missing = DEFAULT_NATURES.filter(
    (item) => !existingKeys.has(`${item.legacyId}:${item.name.toLowerCase()}`)
  );

  return [...natures, ...missing].sort(
    (a, b) =>
      (a.displayOrder ?? a.legacyId) - (b.displayOrder ?? b.legacyId)
  );
}

export function cleanLegacyNotificationBody(value: string): string {
  return value.replace(/"/g, "");
}

function buildNotificationDetail(
  detail: Partial<Record<keyof ParentNotificationDetail, unknown>>
): ParentNotificationDetail {
  return {
    subject: toNotificationString(detail.subject),
    body: cleanLegacyNotificationBody(toNotificationString(detail.body)),
    datetime: toNotificationString(detail.datetime),
  };
}

function nature(
  legacyId: number,
  name: string,
  contentTable: string,
  parentDeliveryTable: string | null,
  subjectColumn: string,
  bodyColumn: string
): ParentNotificationNature {
  return {
    legacyId,
    name,
    contentTable,
    parentDeliveryTable,
    subjectColumn,
    bodyColumn,
    displayOrder: legacyId,
    isActive: true,
  };
}

function toNotificationString(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}
