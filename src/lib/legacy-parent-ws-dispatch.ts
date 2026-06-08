import type { NextRequest } from "next/server";
import * as absence from "@/app/ws/absence.php/route";
import * as birthdaysAlarms from "@/app/ws/birthdays_alarms.php/route";
import * as daily from "@/app/ws/daily.php/route";
import * as eventsAlarms from "@/app/ws/events_alarms.php/route";
import * as finance from "@/app/ws/finance.php/route";
import * as foodCalendar from "@/app/ws/foodcalendar.php/route";
import * as generalAlarms from "@/app/ws/general_alarms.php/route";
import * as holidayCalendar from "@/app/ws/holcalendar.php/route";
import * as holidayCalendarOld from "@/app/ws/holcalendarOLD.php/route";
import * as insuranceAlarms from "@/app/ws/insurance_alarms.php/route";
import * as login from "@/app/ws/login.php/route";
import * as medicineAlarms from "@/app/ws/medicine_alarms.php/route";
import * as message from "@/app/ws/message.php/route";
import * as messages from "@/app/ws/messages.php/route";
import * as messagesList from "@/app/ws/messagesList.php/route";
import * as missingReportsAlarms from "@/app/ws/missingReports_alarms.php/route";
import * as newAssessmentAlarms from "@/app/ws/newassessment_alarms.php/route";
import * as newDaily from "@/app/ws/newdaily.php/route";
import * as notifications from "@/app/ws/notifications.php/route";
import * as notificationsMaster from "@/app/ws/notifications_master.php/route";
import * as paymentsAlarms from "@/app/ws/payments_alarms.php/route";
import * as pushNotifications from "@/app/ws/pnotifications.php/route";
import * as sendMessage from "@/app/ws/sendMessage.php/route";
import * as vaccinationsAlarms from "@/app/ws/vaccinations_alarms.php/route";

type MaybeLegacyWsHandler = (
  request: NextRequest
) => Response | undefined | Promise<Response | undefined>;
type LegacyWsRoute = {
  GET?: MaybeLegacyWsHandler;
  POST?: MaybeLegacyWsHandler;
};

export const LEGACY_PARENT_WS_ROUTES: Record<string, LegacyWsRoute> = {
  "absence.php": absence,
  "birthdays_alarms.php": birthdaysAlarms,
  "daily.php": daily,
  "events_alarms.php": eventsAlarms,
  "finance.php": finance,
  "foodcalendar.php": foodCalendar,
  "general_alarms.php": generalAlarms,
  "holcalendar.php": holidayCalendar,
  "holcalendarOLD.php": holidayCalendarOld,
  "insurance_alarms.php": insuranceAlarms,
  "login.php": login,
  "medicine_alarms.php": medicineAlarms,
  "message.php": message,
  "messages.php": messages,
  "messagesList.php": messagesList,
  "missingReports_alarms.php": missingReportsAlarms,
  "newassessment_alarms.php": newAssessmentAlarms,
  "newdaily.php": newDaily,
  "notifications.php": notifications,
  "notifications_master.php": notificationsMaster,
  "payments_alarms.php": paymentsAlarms,
  "pnotifications.php": pushNotifications,
  "sendMessage.php": sendMessage,
  "vaccinations_alarms.php": vaccinationsAlarms,
};

export const LEGACY_PARENT_WS_ENDPOINTS = Object.keys(
  LEGACY_PARENT_WS_ROUTES
).sort();

export function hasLegacyParentWsEndpoint(endpoint: string) {
  return endpoint in LEGACY_PARENT_WS_ROUTES;
}

export function getLegacyParentWsAllowHeader(endpoint: string) {
  const route = LEGACY_PARENT_WS_ROUTES[endpoint];
  if (!route) return "";

  return (["GET", "POST"] as const)
    .filter((method) => Boolean(route[method]))
    .join(", ");
}

export async function dispatchLegacyParentWsEndpoint(
  request: NextRequest,
  endpoint: string
) {
  const route = LEGACY_PARENT_WS_ROUTES[endpoint];
  if (!route) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const method =
    request.method === "GET" || request.method === "POST"
      ? request.method
      : null;
  const handler = method ? route[method] : null;

  if (!handler) {
    return new Response(null, {
      status: 405,
      headers: { Allow: getLegacyParentWsAllowHeader(endpoint) },
    });
  }

  const response = await handler(request);
  return response ?? jsonRouteHandlerError();
}

function jsonRouteHandlerError() {
  return Response.json(
    { error: "Route handler did not return a response" },
    { status: 500 }
  );
}
