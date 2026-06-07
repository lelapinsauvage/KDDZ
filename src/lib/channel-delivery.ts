import { db } from "@/lib/db";

export type MessageDeliveryChannel = "sms" | "whatsapp";

export type ChannelDeliveryRecipient = {
  phone: string;
  normalizedPhone: string;
  parentUserId?: string | null;
  childId?: string | null;
  childName?: string | null;
  parentType?: string | null;
  parentName?: string | null;
};

export type ChannelDeliverySummary = {
  channel: MessageDeliveryChannel;
  provider: "disabled" | "webhook";
  configured: boolean;
  matchedParentUserCount: number;
  recipientCount: number;
  attemptedCount: number;
  deliveredCount: number;
  skippedCount: number;
  failedCount: number;
  errors: string[];
};

export type ChannelDeliveryAudit = ChannelDeliverySummary;

type DeliverChannelParams = {
  channel: MessageDeliveryChannel;
  recipientParentUserIds?: string[];
  recipients?: ChannelDeliveryRecipient[];
  subject?: string | null;
  body: string;
  category?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

function env(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function providerEnvPrefix(channel: MessageDeliveryChannel) {
  return channel === "sms" ? "SMS_DELIVERY" : "WHATSAPP_DELIVERY";
}

function webhookUrl(channel: MessageDeliveryChannel) {
  const prefix = providerEnvPrefix(channel);
  return (
    env(`${prefix}_WEBHOOK_URL`) ??
    env("LEGACY_CHANNEL_DELIVERY_WEBHOOK_URL") ??
    env("MESSAGE_CHANNEL_DELIVERY_WEBHOOK_URL")
  );
}

function webhookToken(channel: MessageDeliveryChannel) {
  const prefix = providerEnvPrefix(channel);
  return (
    env(`${prefix}_WEBHOOK_TOKEN`) ??
    env("LEGACY_CHANNEL_DELIVERY_WEBHOOK_TOKEN") ??
    env("MESSAGE_CHANNEL_DELIVERY_WEBHOOK_TOKEN")
  );
}

function deliveryProvider(channel: MessageDeliveryChannel): "disabled" | "webhook" {
  const configured = env(`${providerEnvPrefix(channel)}_PROVIDER`)?.toLowerCase();
  if (configured === "disabled") return "disabled";
  if (configured === "webhook") return "webhook";
  if (webhookUrl(channel)) return "webhook";
  return "disabled";
}

function normalizePhone(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const keepPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) return null;
  if (digits.length < 6) return null;
  if (keepPlus) return `+${digits}`;
  if (digits.startsWith("00") && digits.length > 8) return `+${digits.slice(2)}`;
  return digits;
}

function uniqueRecipients(recipients: ChannelDeliveryRecipient[]) {
  const seen = new Set<string>();
  const unique: ChannelDeliveryRecipient[] = [];
  for (const recipient of recipients) {
    const normalizedPhone = normalizePhone(recipient.normalizedPhone || recipient.phone);
    if (!normalizedPhone || seen.has(normalizedPhone)) continue;
    seen.add(normalizedPhone);
    unique.push({
      ...recipient,
      phone: recipient.phone.trim(),
      normalizedPhone,
    });
  }
  return unique;
}

function addPhoneCandidate(
  recipients: ChannelDeliveryRecipient[],
  params: Omit<ChannelDeliveryRecipient, "phone" | "normalizedPhone"> & {
    phone?: string | null;
  },
) {
  const raw = params.phone?.trim();
  if (!raw) return;
  const normalizedPhone = normalizePhone(raw);
  if (!normalizedPhone) return;
  recipients.push({
    phone: raw,
    normalizedPhone,
    parentUserId: params.parentUserId,
    childId: params.childId,
    childName: params.childName,
    parentType: params.parentType,
    parentName: params.parentName,
  });
}

async function resolveParentRecipients(parentUserIds: string[] | undefined) {
  const ids = Array.from(new Set((parentUserIds ?? []).filter(Boolean)));
  if (ids.length === 0) {
    return { matchedParentUserCount: 0, recipients: [] as ChannelDeliveryRecipient[] };
  }

  const parentUsers = await db.parentUser.findMany({
    where: { id: { in: ids }, isActive: true },
    select: {
      id: true,
      childId: true,
      child: {
        select: {
          firstName: true,
          lastName: true,
          parents: {
            select: {
              type: true,
              firstName: true,
              lastName: true,
              phone: true,
              mobile: true,
            },
          },
        },
      },
    },
  });

  const recipients: ChannelDeliveryRecipient[] = [];
  for (const parentUser of parentUsers) {
    const childName = [parentUser.child.firstName, parentUser.child.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    for (const parent of parentUser.child.parents) {
      const parentName = [parent.firstName, parent.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
      const base = {
        parentUserId: parentUser.id,
        childId: parentUser.childId,
        childName: childName || null,
        parentType: parent.type,
        parentName: parentName || null,
      };
      addPhoneCandidate(recipients, { ...base, phone: parent.mobile });
      addPhoneCandidate(recipients, { ...base, phone: parent.phone });
    }
  }

  return {
    matchedParentUserCount: parentUsers.length,
    recipients: uniqueRecipients(recipients),
  };
}

function emptySummary(
  params: Pick<ChannelDeliverySummary, "channel" | "provider" | "configured"> & {
    matchedParentUserCount: number;
    recipientCount: number;
    attemptedCount?: number;
    deliveredCount?: number;
    skippedCount?: number;
    failedCount?: number;
    errors?: string[];
  },
): ChannelDeliverySummary {
  return {
    channel: params.channel,
    provider: params.provider,
    configured: params.configured,
    matchedParentUserCount: params.matchedParentUserCount,
    recipientCount: params.recipientCount,
    attemptedCount: params.attemptedCount ?? 0,
    deliveredCount: params.deliveredCount ?? 0,
    skippedCount: params.skippedCount ?? 0,
    failedCount: params.failedCount ?? 0,
    errors: params.errors ?? [],
  };
}

async function postWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function deliverParentChannelNotification(
  params: DeliverChannelParams,
): Promise<ChannelDeliverySummary> {
  const resolved = await resolveParentRecipients(params.recipientParentUserIds);
  const recipients = uniqueRecipients([...(params.recipients ?? []), ...resolved.recipients]);
  const recipientCount = recipients.length;
  const provider = deliveryProvider(params.channel);

  if (recipientCount === 0) {
    return emptySummary({
      channel: params.channel,
      provider,
      configured: provider === "webhook" && Boolean(webhookUrl(params.channel)),
      matchedParentUserCount: resolved.matchedParentUserCount,
      recipientCount,
      skippedCount: resolved.matchedParentUserCount,
      errors: ["No parent phone numbers available for this recipient set"],
    });
  }

  if (provider === "disabled") {
    return emptySummary({
      channel: params.channel,
      provider,
      configured: false,
      matchedParentUserCount: resolved.matchedParentUserCount,
      recipientCount,
      skippedCount: recipientCount,
      errors: [`${params.channel.toUpperCase()} delivery provider is not configured`],
    });
  }

  const url = webhookUrl(params.channel);
  if (!url) {
    return emptySummary({
      channel: params.channel,
      provider: "webhook",
      configured: false,
      matchedParentUserCount: resolved.matchedParentUserCount,
      recipientCount,
      skippedCount: recipientCount,
      errors: [
        `Set ${providerEnvPrefix(params.channel)}_WEBHOOK_URL to enable ${params.channel.toUpperCase()} delivery`,
      ],
    });
  }

  try {
    const response = await postWithTimeout(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(webhookToken(params.channel)
          ? { Authorization: `Bearer ${webhookToken(params.channel)}` }
          : {}),
      },
      body: JSON.stringify({
        channel: params.channel,
        recipients,
        subject: params.subject,
        body: params.body,
        category: params.category,
        metadata: params.metadata,
      }),
    });

    if (!response.ok) {
      const error = (await response.text()).slice(0, 240);
      return emptySummary({
        channel: params.channel,
        provider: "webhook",
        configured: true,
        matchedParentUserCount: resolved.matchedParentUserCount,
        recipientCount,
        attemptedCount: recipientCount,
        failedCount: recipientCount,
        errors: [error || `Webhook returned HTTP ${response.status}`],
      });
    }

    return emptySummary({
      channel: params.channel,
      provider: "webhook",
      configured: true,
      matchedParentUserCount: resolved.matchedParentUserCount,
      recipientCount,
      attemptedCount: recipientCount,
      deliveredCount: recipientCount,
    });
  } catch (error) {
    return emptySummary({
      channel: params.channel,
      provider: "webhook",
      configured: true,
      matchedParentUserCount: resolved.matchedParentUserCount,
      recipientCount,
      attemptedCount: recipientCount,
      failedCount: recipientCount,
      errors: [
        error instanceof Error
          ? error.message
          : `${params.channel.toUpperCase()} webhook delivery failed`,
      ],
    });
  }
}

export function channelDeliveryAuditData(
  summary: ChannelDeliverySummary,
): ChannelDeliveryAudit {
  return {
    channel: summary.channel,
    provider: summary.provider,
    configured: summary.configured,
    matchedParentUserCount: summary.matchedParentUserCount,
    recipientCount: summary.recipientCount,
    attemptedCount: summary.attemptedCount,
    deliveredCount: summary.deliveredCount,
    skippedCount: summary.skippedCount,
    failedCount: summary.failedCount,
    errors: summary.errors,
  };
}
