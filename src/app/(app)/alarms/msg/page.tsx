import { getMessageAlarms } from "@/lib/actions/messages";
import { MessageAlarmsClient } from "./message-alarms-client";

export default async function MessageAlarmsPage() {
  const result = await getMessageAlarms({ pageSize: "all" });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = result.data as any;
  const messages = (data?.messages ?? []) as Array<{
    id: string;
    legacyId: number | null;
    senderId: string;
    senderType: string;
    senderName: string;
    date: string;
    nature: string;
    subject: string | null;
    body: string;
    isRead: boolean;
    status: "Viewed" | "New";
    threadId: string | null;
    legacyHref: string | null;
    searchText: string;
  }>;
  const total = (data?.total ?? 0) as number;

  return <MessageAlarmsClient messages={messages} total={total} />;
}
