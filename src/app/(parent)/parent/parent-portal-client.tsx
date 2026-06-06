"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ChefHat,
  CreditCard,
  FileText,
  Loader2,
  LogOut,
  Mail,
  MessageSquare,
  RefreshCw,
  Send,
  Stethoscope,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const TOKEN_KEY = "kiddzonline_parent_token";
const CHILD_ID_KEY = "kiddzonline_parent_child_id";
const CHILD_NAME_KEY = "kiddzonline_parent_child_name";

type HeaderRow = {
  name?: string;
  status?: boolean;
  count?: number;
  [key: string]: unknown;
};

type DailyReportRow = {
  report_id?: string;
  reportdate?: string;
  bname?: string;
  lname?: string;
  dessert?: string;
  bftime?: string;
  lntime?: string;
  desstime?: string;
  breakf?: number;
  lunchf?: number;
  dess_portion?: number;
  is_sleep?: string;
  sleep_from?: string;
  sleep_to?: string;
  fever?: { fvalue?: string; ftime?: string }[];
  milk?: { mcc?: string; mtime?: string }[];
  mood?: string;
  remarks?: string;
};

type FinanceRow = {
  type?: string;
  target?: string;
  for?: string;
  currency?: string;
  datetime?: string;
  amount?: string;
  from?: string;
  to?: string;
};

type AbsenceRow = {
  report_id?: string;
  reportdate?: string;
  ab_reason?: string;
  is_rep_draft?: string;
};

type MessageRow = {
  thread_id?: string | number;
  modern_thread_id?: string | null;
  legacy_thread_id?: string | number | null;
  subject?: string;
  last_message?: string;
  original_sender?: string;
  datetime?: string;
};

type ThreadMessageRow = {
  thread_id?: string | number;
  modern_thread_id?: string | null;
  legacy_thread_id?: string | number | null;
  datetime?: string;
  sender?: string | number;
  sender_type?: string;
  subject?: string;
  message?: string;
  is_read?: boolean;
};

type FoodRow = {
  date?: string;
  bname?: string;
  lname?: string;
  dessert?: string;
};

type HolidayRow = {
  description?: string;
  date?: string;
};

type NotificationDetail = {
  datetime?: string;
  subject?: string;
  body?: string;
};

type NotificationGroup = {
  name?: string;
  details?: NotificationDetail[];
};

type PortalData = {
  childName: string;
  dailyHeader?: HeaderRow;
  daily: DailyReportRow[];
  financeHeader?: HeaderRow;
  finance: FinanceRow[];
  absenceHeader?: HeaderRow;
  absences: AbsenceRow[];
  messagesHeader?: HeaderRow;
  messages: MessageRow[];
  foodHeader?: HeaderRow;
  food: FoodRow[];
  holidaysHeader?: HeaderRow;
  holidays: HolidayRow[];
  notificationInfo?: HeaderRow;
  notifications: { group: string; detail: NotificationDetail }[];
};

const emptyPortalData: PortalData = {
  childName: "",
  daily: [],
  finance: [],
  absences: [],
  messages: [],
  food: [],
  holidays: [],
  notifications: [],
};

function splitLegacyList<T>(value: unknown): { header?: HeaderRow; rows: T[] } {
  if (!Array.isArray(value)) return { rows: [] };
  const [header, ...rows] = value;
  return {
    header: typeof header === "object" && header !== null ? (header as HeaderRow) : undefined,
    rows: rows as T[],
  };
}

function normalizeThreadMessages(value: unknown): ThreadMessageRow[] {
  if (Array.isArray(value)) return value as ThreadMessageRow[];
  if (!value || typeof value !== "object") return [];
  return Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, row]) => row as ThreadMessageRow);
}

function threadIdForMessage(message: MessageRow) {
  return String(message.thread_id || message.modern_thread_id || "");
}

function flattenNotifications(value: unknown) {
  if (!value || typeof value !== "object") {
    return { info: undefined, rows: [] as { group: string; detail: NotificationDetail }[] };
  }

  const payload = value as Record<string, unknown>;
  const rows: { group: string; detail: NotificationDetail }[] = [];

  Object.entries(payload).forEach(([key, item]) => {
    if (!key.startsWith("notification")) return;
    const group = item as NotificationGroup;
    (group.details || []).forEach((detail) => {
      rows.push({ group: group.name || key, detail });
    });
  });

  return {
    info: payload.info as HeaderRow | undefined,
    rows: rows.sort((a, b) => {
      const dateA = Date.parse(a.detail.datetime || "");
      const dateB = Date.parse(b.detail.datetime || "");
      return (Number.isFinite(dateB) ? dateB : 0) - (Number.isFinite(dateA) ? dateA : 0);
    }),
  };
}

function formatDisplayDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatMoney(row: FinanceRow) {
  const amount = Number(row.amount || 0);
  const displayAmount = Number.isFinite(amount) ? amount.toLocaleString("en", { maximumFractionDigits: 2 }) : row.amount;
  return `${displayAmount || "0"} ${row.currency || ""}`.trim();
}

function portionLabel(value?: number) {
  const labels: Record<number, string> = {
    0: "Unset",
    1: "None",
    2: "Little",
    3: "Half",
    4: "Well",
  };
  return labels[Number(value)] || "Unset";
}

export function ParentPortalClient() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [childId, setChildId] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<MessageRow | null>(null);
  const [data, setData] = useState<PortalData>(emptyPortalData);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadPortal = useCallback(
    async (activeToken: string, activeChildId: string, storedName: string, refreshing = false) => {
      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError("");

      try {
        const headers = { Authorization: `Bearer ${activeToken}` };
        const endpoints = {
          daily: `/api/parent/daily/${activeChildId}/detailed`,
          finance: `/api/parent/finance/${activeChildId}`,
          absences: `/api/parent/absence/${activeChildId}`,
          messages: `/api/parent/messages/${activeChildId}`,
          notifications: `/api/parent/notifications/${activeChildId}`,
          food: "/api/parent/calendar/food",
          holidays: "/api/parent/calendar/holidays",
        };

        const responses = await Promise.all(
          Object.values(endpoints).map((url) => fetch(url, { headers }))
        );

        if (responses.some((response) => response.status === 401 || response.status === 403)) {
          clearSession();
          router.replace("/parent/login");
          return;
        }

        const payloads = await Promise.all(responses.map((response) => response.json()));
        const [dailyPayload, financePayload, absencePayload, messagesPayload, notificationsPayload, foodPayload, holidayPayload] =
          payloads;

        const daily = splitLegacyList<DailyReportRow>(dailyPayload);
        const finance = splitLegacyList<FinanceRow>(financePayload);
        const absences = splitLegacyList<AbsenceRow>(absencePayload);
        const messages = splitLegacyList<MessageRow>(messagesPayload);
        const food = splitLegacyList<FoodRow>(foodPayload);
        const holidays = splitLegacyList<HolidayRow>(holidayPayload);
        const notifications = flattenNotifications(notificationsPayload);
        const childName =
          daily.header?.name ||
          finance.header?.name ||
          absences.header?.name ||
          messages.header?.name ||
          notifications.info?.name ||
          storedName;

        setData({
          childName: String(childName || "Parent portal"),
          dailyHeader: daily.header,
          daily: daily.rows,
          financeHeader: finance.header,
          finance: finance.rows,
          absenceHeader: absences.header,
          absences: absences.rows,
          messagesHeader: messages.header,
          messages: messages.rows,
          foodHeader: food.header,
          food: food.rows,
          holidaysHeader: holidays.header,
          holidays: holidays.rows,
          notificationInfo: notifications.info,
          notifications: notifications.rows,
        });
      } catch {
        setError("Could not load the parent portal.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [router]
  );

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_KEY);
    const storedChildId = window.localStorage.getItem(CHILD_ID_KEY);
    const storedName = window.localStorage.getItem(CHILD_NAME_KEY) || "";

    if (!storedToken || !storedChildId) {
      router.replace("/parent/login");
      return;
    }

    setToken(storedToken);
    setChildId(storedChildId);
    void loadPortal(storedToken, storedChildId, storedName);
  }, [loadPortal, router]);

  function handleLogout() {
    clearSession();
    router.replace("/parent/login");
  }

  async function handleRefresh() {
    if (!token || !childId) return;
    const storedName = window.localStorage.getItem(CHILD_NAME_KEY) || "";
    await loadPortal(token, childId, storedName, true);
  }

  const latestDaily = data.daily[0];
  const dashboardStats = useMemo(
    () => [
      { label: "Daily reports", value: data.dailyHeader?.count ?? data.daily.length, icon: FileText, color: "attendance" as const },
      { label: "Payments", value: data.financeHeader?.count ?? data.finance.length, icon: CreditCard, color: "finance" as const },
      { label: "Messages", value: data.messagesHeader?.count ?? data.messages.length, icon: Mail, color: "comms" as const },
      { label: "Notifications", value: data.notifications.length, icon: Bell, color: "alerts" as const },
    ],
    [data]
  );

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f5] px-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin text-primary" />
          Loading parent portal
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <header className="border-b border-[#3f4b5a] bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex min-h-16 w-full max-w-[1360px] flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">KiddzOnline Parents</p>
            <h1 className="mt-1 text-xl font-semibold text-white">{data.childName}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Refresh
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-sidebar-accent hover:text-white" onClick={handleLogout}>
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1360px] px-4 py-6 sm:px-6">
        {error ? (
          <div className="mb-4 border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardStats.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className="py-4">
                <CardContent className="flex items-center justify-between gap-4 px-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-2xl font-semibold">{item.value}</p>
                  </div>
                  <span className={cn("flex size-10 items-center justify-center rounded-sm", iconColorClass(item.color))}>
                    <Icon className="size-5" />
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4 text-attendance" />
                Latest daily report
              </CardTitle>
            </CardHeader>
            <CardContent>
              {latestDaily ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{formatDisplayDate(latestDaily.reportdate)}</p>
                    <h2 className="mt-1 text-lg font-semibold">Daily care summary</h2>
                    {latestDaily.mood ? <Badge variant="success" className="mt-3">{latestDaily.mood}</Badge> : null}
                  </div>
                  <CareMetric label="Breakfast" value={latestDaily.bname || "No meal"} detail={`${portionLabel(latestDaily.breakf)} ${latestDaily.bftime || ""}`} />
                  <CareMetric label="Lunch" value={latestDaily.lname || "No meal"} detail={`${portionLabel(latestDaily.lunchf)} ${latestDaily.lntime || ""}`} />
                  <CareMetric label="Dessert" value={latestDaily.dessert || "No dessert"} detail={`${portionLabel(latestDaily.dess_portion)} ${latestDaily.desstime || ""}`} />
                  <CareMetric label="Sleep" value={latestDaily.is_sleep === "1" ? "Slept" : "No sleep"} detail={[latestDaily.sleep_from, latestDaily.sleep_to].filter(Boolean).join(" - ")} />
                  <CareMetric label="Milk and fever" value={`${latestDaily.milk?.length || 0} milk logs`} detail={`${latestDaily.fever?.length || 0} fever logs`} />
                  {latestDaily.remarks ? (
                    <div className="border border-border bg-[#fafafa] p-3 md:col-span-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Remarks</p>
                      <p className="mt-1 text-sm">{latestDaily.remarks}</p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <EmptyState label="No daily reports found" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="size-4 text-alerts" />
                Recent notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.notifications.slice(0, 5).map((item, index) => (
                  <NotificationItem key={`${item.group}-${item.detail.datetime}-${index}`} item={item} />
                ))}
                {data.notifications.length === 0 ? <EmptyState label="No notifications found" /> : null}
              </div>
            </CardContent>
          </Card>
        </section>

        <Tabs defaultValue="daily" className="mt-6">
          <div className="overflow-x-auto pb-1">
            <TabsList className="min-w-max">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="absence">Absence</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="daily" className="mt-4">
            <DataPanel icon={FileText} title="Daily reports">
              <div className="grid gap-3 lg:grid-cols-2">
                {data.daily.map((report) => (
                  <Card key={report.report_id || report.reportdate} className="py-4">
                    <CardContent className="space-y-3 px-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{formatDisplayDate(report.reportdate)}</p>
                          <p className="text-sm text-muted-foreground">{report.remarks || "No remarks"}</p>
                        </div>
                        <Badge variant="attendance">{report.mood || "Report"}</Badge>
                      </div>
                      <div className="grid gap-2 text-sm sm:grid-cols-3">
                        <MiniMetric label="Breakfast" value={report.bname || "-"} />
                        <MiniMetric label="Lunch" value={report.lname || "-"} />
                        <MiniMetric label="Sleep" value={report.is_sleep === "1" ? "Yes" : "No"} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {data.daily.length === 0 ? <EmptyState label="No daily reports found" /> : null}
            </DataPanel>
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <DataPanel icon={CreditCard} title="Payments">
              <div className="overflow-hidden border border-border">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-muted text-xs font-semibold uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Method</th>
                      <th className="px-3 py-2">Period</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.finance.map((payment, index) => (
                      <tr key={`${payment.datetime}-${payment.target}-${index}`} className="border-t border-border">
                        <td className="px-3 py-2">{formatDisplayDate(payment.datetime)}</td>
                        <td className="px-3 py-2">{payment.target || "-"}</td>
                        <td className="px-3 py-2">{payment.type || "-"}</td>
                        <td className="px-3 py-2">{[payment.from, payment.to].filter(Boolean).map(formatDisplayDate).join(" - ") || "-"}</td>
                        <td className="px-3 py-2 text-right font-semibold">{formatMoney(payment)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.finance.length === 0 ? <EmptyState label="No payments found" /> : null}
            </DataPanel>
          </TabsContent>

          <TabsContent value="absence" className="mt-4">
            <DataPanel icon={Stethoscope} title="Absence reports">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {data.absences.map((absence) => (
                  <Card key={absence.report_id || absence.reportdate} className="py-4">
                    <CardContent className="px-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{formatDisplayDate(absence.reportdate)}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{absence.ab_reason || "No reason recorded"}</p>
                        </div>
                        <Badge variant={absence.is_rep_draft === "1" ? "warning" : "success"}>
                          {absence.is_rep_draft === "1" ? "Draft" : "Submitted"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {data.absences.length === 0 ? <EmptyState label="No absence reports found" /> : null}
            </DataPanel>
          </TabsContent>

          <TabsContent value="messages" className="mt-4">
            <DataPanel icon={Mail} title="Messages">
              <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                {selectedMessage ? (
                  <ParentMessageThread
                    token={token}
                    childId={childId}
                    message={selectedMessage}
                    onBack={() => setSelectedMessage(null)}
                    onSent={handleRefresh}
                  />
                ) : (
                  <ComposeMessage token={token} childId={childId} onSent={handleRefresh} />
                )}
                <div className="space-y-3">
                  {data.messages.map((message) => (
                    <Card
                      key={threadIdForMessage(message) || `${message.subject}-${message.datetime}`}
                      className={cn(
                        "py-4",
                        selectedMessage && threadIdForMessage(selectedMessage) === threadIdForMessage(message)
                          ? "border-primary"
                          : ""
                      )}
                    >
                      <CardContent className="px-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-semibold">{message.subject || "Message"}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{message.last_message || ""}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Badge variant="comms">{message.original_sender || "Administration"}</Badge>
                            <span className="text-xs text-muted-foreground">{formatDisplayDate(message.datetime)}</span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedMessage(message)}
                              disabled={!threadIdForMessage(message)}
                            >
                              <MessageSquare className="size-4" />
                              Open
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {data.messages.length === 0 ? <EmptyState label="No messages found" /> : null}
                </div>
              </div>
            </DataPanel>
          </TabsContent>

          <TabsContent value="calendar" className="mt-4">
            <DataPanel icon={CalendarDays} title="Calendars">
              <div className="grid gap-4 xl:grid-cols-2">
                <CalendarColumn icon={ChefHat} title="Food calendar">
                  {data.food.slice(0, 20).map((item) => (
                    <div key={item.date} className="border-b border-border py-3 last:border-b-0">
                      <p className="font-semibold">{formatDisplayDate(item.date)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {[item.bname, item.lname, item.dessert].filter(Boolean).join(" / ") || "No meals recorded"}
                      </p>
                    </div>
                  ))}
                  {data.food.length === 0 ? <EmptyState label="No food calendar entries found" /> : null}
                </CalendarColumn>
                <CalendarColumn icon={CalendarDays} title="Holidays">
                  {data.holidays.slice(0, 20).map((item) => (
                    <div key={`${item.description}-${item.date}`} className="border-b border-border py-3 last:border-b-0">
                      <p className="font-semibold">{item.description || "Holiday"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{formatDisplayDate(item.date)}</p>
                    </div>
                  ))}
                  {data.holidays.length === 0 ? <EmptyState label="No holidays found" /> : null}
                </CalendarColumn>
              </div>
            </DataPanel>
          </TabsContent>

          <TabsContent value="notifications" className="mt-4">
            <DataPanel icon={Bell} title="Notifications">
              <div className="grid gap-3 lg:grid-cols-2">
                {data.notifications.map((item, index) => (
                  <NotificationItem key={`${item.group}-${item.detail.datetime}-${index}`} item={item} framed />
                ))}
              </div>
              {data.notifications.length === 0 ? <EmptyState label="No notifications found" /> : null}
            </DataPanel>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(CHILD_ID_KEY);
  window.localStorage.removeItem(CHILD_NAME_KEY);
}

function iconColorClass(color: "attendance" | "finance" | "comms" | "alerts") {
  const classes = {
    attendance: "bg-attendance-light text-attendance",
    finance: "bg-finance-light text-finance",
    comms: "bg-comms-light text-comms",
    alerts: "bg-alerts-light text-alerts",
  };
  return classes[color];
}

function CareMetric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="border border-border bg-[#fafafa] p-3">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
      {detail ? <p className="mt-1 text-sm text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted px-3 py-2">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 truncate">{value}</p>
    </div>
  );
}

function DataPanel({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof FileText;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-border bg-white">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Icon className="size-4 text-primary" />
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function CalendarColumn({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof CalendarDays;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-border bg-[#fafafa]">
      <div className="flex items-center gap-2 border-b border-border bg-white px-4 py-3">
        <Icon className="size-4 text-primary" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="px-4">{children}</div>
    </section>
  );
}

function NotificationItem({
  item,
  framed = false,
}: {
  item: { group: string; detail: NotificationDetail };
  framed?: boolean;
}) {
  const content = (
    <div className="flex items-start gap-3">
      <Badge variant="alerts" className="mt-0.5">{item.group}</Badge>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold">{item.detail.subject || "Notification"}</p>
          <span className="text-xs text-muted-foreground">{formatDisplayDate(item.detail.datetime)}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.detail.body || ""}</p>
      </div>
    </div>
  );

  if (!framed) return content;

  return (
    <Card className="py-4">
      <CardContent className="px-4">{content}</CardContent>
    </Card>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="border border-dashed border-border bg-[#fafafa] px-4 py-8 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function ParentMessageThread({
  token,
  childId,
  message,
  onBack,
  onSent,
}: {
  token: string;
  childId: string;
  message: MessageRow;
  onBack: () => void;
  onSent: () => Promise<void>;
}) {
  const [threadMessages, setThreadMessages] = useState<ThreadMessageRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const threadId = threadIdForMessage(message);

  const loadThread = useCallback(async () => {
    if (!token || !threadId) return;
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/parent/messages/thread/${encodeURIComponent(threadId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setError("Could not load this conversation.");
        return;
      }
      const payload = await response.json();
      setThreadMessages(normalizeThreadMessages(payload));
    } catch {
      setError("Could not load this conversation.");
    } finally {
      setIsLoading(false);
    }
  }, [threadId, token]);

  useEffect(() => {
    void loadThread();
  }, [loadThread]);

  async function handleSent() {
    await onSent();
    await loadThread();
  }

  return (
    <section className="space-y-4 border border-border bg-[#fafafa] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Conversation</p>
          <h3 className="mt-1 font-semibold">{message.subject || "Message"}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{message.last_message || ""}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onBack}>
          New message
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading conversation
        </div>
      ) : null}

      {error ? (
        <div className="border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
        {threadMessages.map((item, index) => {
          const isParent = String(item.sender) === "1" || item.sender_type === "PARENT";
          return (
            <div
              key={`${item.thread_id}-${item.datetime}-${index}`}
              className={cn(
                "border border-border bg-white p-3",
                isParent ? "ml-6 border-primary/30" : "mr-6"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <Badge variant={isParent ? "comms" : "secondary"}>
                  {isParent ? "You" : "Administration"}
                </Badge>
                <span className="text-xs text-muted-foreground">{formatDisplayDate(item.datetime)}</span>
              </div>
              {item.subject ? <p className="mt-2 text-sm font-semibold">{item.subject}</p> : null}
              <p className="mt-2 whitespace-pre-wrap text-sm">{item.message || ""}</p>
            </div>
          );
        })}
        {!isLoading && threadMessages.length === 0 ? <EmptyState label="No messages in this conversation" /> : null}
      </div>

      <ReplyMessageForm
        token={token}
        childId={childId}
        threadId={threadId}
        subject={message.subject || "Message"}
        onSent={handleSent}
      />
    </section>
  );
}

function ReplyMessageForm({
  token,
  childId,
  threadId,
  subject,
  onSent,
}: {
  token: string;
  childId: string;
  threadId: string;
  subject: string;
  onSent: () => Promise<void>;
}) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !childId || !threadId || !message.trim()) return;
    setStatus("");
    setIsSending(true);

    try {
      const response = await fetch("/api/parent/messages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usites: childId,
          to: "1",
          threadid: threadId,
          subject,
          message,
        }),
      });

      const data = (await response.json()) as { feedback?: string };
      setStatus(data.feedback || (response.ok ? "Message Sent" : "Message Failed to Send"));
      if (response.ok && data.feedback === "Message Sent") {
        setMessage("");
        await onSent();
      }
    } catch {
      setStatus("Message Failed to Send");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form className="space-y-3 border-t border-border pt-4" onSubmit={handleSubmit}>
      <Label htmlFor="message-reply">Reply</Label>
      <Textarea id="message-reply" value={message} onChange={(event) => setMessage(event.target.value)} required />
      {status ? (
        <div className={cn("border px-3 py-2 text-sm", status === "Message Sent" ? "border-success/30 bg-success-light text-success-dark" : "border-destructive/30 bg-destructive/10 text-destructive")}>
          {status}
        </div>
      ) : null}
      <Button type="submit" disabled={isSending}>
        {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Reply
      </Button>
    </form>
  );
}

function ComposeMessage({
  token,
  childId,
  onSent,
}: {
  token: string;
  childId: string;
  onSent: () => Promise<void>;
}) {
  const [to, setTo] = useState("1");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !childId) return;
    setStatus("");
    setIsSending(true);

    try {
      const response = await fetch("/api/parent/messages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usites: childId,
          to,
          threadid: "0",
          subject,
          message,
        }),
      });

      const data = (await response.json()) as { feedback?: string };
      setStatus(data.feedback || (response.ok ? "Message Sent" : "Message Failed to Send"));
      if (response.ok && data.feedback === "Message Sent") {
        setSubject("");
        setMessage("");
        await onSent();
      }
    } catch {
      setStatus("Message Failed to Send");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form className="space-y-4 border border-border bg-[#fafafa] p-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="message-to">To</Label>
        <select
          id="message-to"
          className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          value={to}
          onChange={(event) => setTo(event.target.value)}
        >
          <option value="1">Administration</option>
          <option value="2">Teachers</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="message-subject">Subject</Label>
        <Input id="message-subject" value={subject} onChange={(event) => setSubject(event.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message-body">Message</Label>
        <Textarea id="message-body" value={message} onChange={(event) => setMessage(event.target.value)} required />
      </div>
      {status ? (
        <div className={cn("border px-3 py-2 text-sm", status === "Message Sent" ? "border-success/30 bg-success-light text-success-dark" : "border-destructive/30 bg-destructive/10 text-destructive")}>
          {status}
        </div>
      ) : null}
      <Button type="submit" disabled={isSending}>
        {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Send
      </Button>
    </form>
  );
}
