import { getInbox } from "@/lib/actions/messages";
import { InboxClient } from "./inbox-client";

export default async function MessageInboxPage() {
  const result = await getInbox();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = result.data as any;
  const rawMessages = (data?.messages ?? []) as Array<{
    id: string;
    senderId: string;
    senderType: string;
    subject: string | null;
    body: string;
    isRead: boolean;
    createdAt: Date;
  }>;
  const total = (data?.total ?? 0) as number;

  // Serialize dates
  const messages = rawMessages.map((msg) => ({
    id: msg.id,
    senderId: msg.senderId,
    senderType: msg.senderType,
    subject: msg.subject,
    body: msg.body,
    isRead: msg.isRead,
    createdAt: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : String(msg.createdAt),
  }));

  return <InboxClient messages={messages} total={total} />;
}
