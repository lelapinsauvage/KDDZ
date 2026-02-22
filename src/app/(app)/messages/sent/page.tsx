import { getSentMessages } from "@/lib/actions/messages";
import { SentClient } from "./sent-client";

export default async function SentMessagesPage() {
  const result = await getSentMessages({ pageSize: 500 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = result.data as any;
  const messages = (data?.messages ?? []) as Array<{
    id: string;
    senderId: string;
    senderType: string;
    recipientId: string;
    recipientType: string;
    recipientName: string;
    subject: string | null;
    body: string;
    isRead: boolean;
    threadId: string | null;
    createdAt: string;
  }>;
  const total = (data?.total ?? 0) as number;

  return <SentClient messages={messages} total={total} />;
}
