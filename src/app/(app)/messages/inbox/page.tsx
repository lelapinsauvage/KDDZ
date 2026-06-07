import { getInbox } from "@/lib/actions/messages";
import { InboxClient } from "./inbox-client";

export default async function MessageInboxPage() {
  const result = await getInbox({ pageSize: 500 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = result.data as any;
  const messages = (data?.messages ?? []) as Array<{
    id: string;
    senderId: string;
    senderType: string;
    senderName: string;
    recipientId: string;
    recipientType: string;
    subject: string | null;
    body: string;
    isRead: boolean;
    threadId: string | null;
    legacyDelivery: {
      channels: string[];
      scope: string | null;
      pendingExternal: boolean;
    };
    createdAt: string;
  }>;
  const total = (data?.total ?? 0) as number;

  return <InboxClient messages={messages} total={total} />;
}
