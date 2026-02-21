import { getSentMessages } from "@/lib/actions/messages";
import { SentClient } from "./sent-client";

export default async function SentMessagesPage() {
  const result = await getSentMessages();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = result.data as any;
  const rawMessages = (data?.messages ?? []) as Array<{
    id: string;
    recipientId: string;
    recipientType: string;
    subject: string | null;
    body: string;
    createdAt: Date;
    threadId: string | null;
  }>;
  const total = (data?.total ?? 0) as number;

  // Serialize dates
  const messages = rawMessages.map((msg) => ({
    id: msg.id,
    recipientId: msg.recipientId,
    recipientType: msg.recipientType,
    subject: msg.subject,
    body: msg.body,
    createdAt: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : String(msg.createdAt),
    threadId: msg.threadId,
  }));

  return <SentClient messages={messages} total={total} />;
}
