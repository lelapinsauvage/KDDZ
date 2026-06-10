import { getMessageById } from "@/lib/actions/messages";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ThreadClient } from "./thread-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MessageDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const result = await getMessageById(id);

  if (!result.success || !result.data) {
    if (result.error === "Forbidden") {
      redirect("/forbidden.php");
    }
    redirect("/messages/inbox");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = result.data as any;

  const message = data.message as {
    id: string;
    legacyId: number | null;
    legacyThreadId: number | null;
    legacyHref: string | null;
    legacyNature: string | null;
    senderId: string;
    senderType: string;
    senderName: string;
    recipientId: string;
    recipientType: string;
    recipientName: string;
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
  };

  const threadMessages = (data.threadMessages ?? []) as Array<{
    id: string;
    legacyId: number | null;
    legacyThreadId: number | null;
    legacyHref: string | null;
    legacyNature: string | null;
    senderId: string;
    senderType: string;
    senderName: string;
    recipientId: string;
    recipientType: string;
    recipientName: string;
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

  return (
    <ThreadClient
      message={message}
      threadMessages={threadMessages}
      currentUserId={session.user.id}
    />
  );
}
