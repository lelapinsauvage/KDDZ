import type { PushPlatform } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export type PushDeliveryToken = {
  token: string;
  platform: PushPlatform;
  userId?: string | null;
  parentUserId?: string | null;
};

export type PushDeliverySummary = {
  provider: "disabled" | "onesignal" | "webhook";
  configured: boolean;
  attemptedCount: number;
  deliveredCount: number;
  skippedCount: number;
  failedCount: number;
  errors: string[];
};

export type PushDeliveryAudit = PushDeliverySummary;

type DeliverPushParams = {
  recipientUserIds?: string[];
  recipientParentUserIds?: string[];
  tokens?: PushDeliveryToken[];
  title: string;
  body: string;
  category?: string;
  url?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

function env(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function deliveryProvider(): PushDeliverySummary["provider"] {
  const configured = env("PUSH_DELIVERY_PROVIDER")?.toLowerCase();
  if (configured === "disabled") return "disabled";
  if (configured === "webhook") return "webhook";
  if (configured === "onesignal") return "onesignal";
  if (env("PUSH_DELIVERY_WEBHOOK_URL")) return "webhook";
  if (env("ONESIGNAL_APP_ID") && oneSignalApiKey()) return "onesignal";
  return "disabled";
}

function oneSignalApiKey() {
  return env("ONESIGNAL_REST_API_KEY") ?? env("ONESIGNAL_API_KEY");
}

function uniqueTokens(tokens: PushDeliveryToken[]) {
  const seen = new Set<string>();
  const unique: PushDeliveryToken[] = [];
  for (const token of tokens) {
    const value = token.token.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    unique.push({ ...token, token: value });
  }
  return unique;
}

function emptySummary(
  provider: PushDeliverySummary["provider"],
  configured: boolean,
  skippedCount: number,
  errors: string[] = [],
): PushDeliverySummary {
  return {
    provider,
    configured,
    attemptedCount: 0,
    deliveredCount: 0,
    skippedCount,
    failedCount: 0,
    errors,
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

async function deliveryTokens(params: DeliverPushParams) {
  const direct = params.tokens ?? [];
  const userIds = Array.from(new Set(params.recipientUserIds ?? []));
  const parentUserIds = Array.from(new Set(params.recipientParentUserIds ?? []));

  if (userIds.length === 0 && parentUserIds.length === 0) {
    return uniqueTokens(direct);
  }

  const rows = await db.pushToken.findMany({
    where: {
      isActive: true,
      OR: [
        ...(userIds.length ? [{ userId: { in: userIds } }] : []),
        ...(parentUserIds.length
          ? [{ parentUserId: { in: parentUserIds } }]
          : []),
      ],
    },
    select: {
      token: true,
      platform: true,
      userId: true,
      parentUserId: true,
    },
  });

  return uniqueTokens([...direct, ...rows]);
}

async function deliverWithWebhook(params: {
  webhookUrl: string;
  webhookToken: string | null;
  tokens: PushDeliveryToken[];
  title: string;
  body: string;
  category?: string;
  url?: string;
  metadata?: DeliverPushParams["metadata"];
}): Promise<PushDeliverySummary> {
  try {
    const response = await postWithTimeout(params.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(params.webhookToken
          ? { Authorization: `Bearer ${params.webhookToken}` }
          : {}),
      },
      body: JSON.stringify({
        tokens: params.tokens,
        title: params.title,
        body: params.body,
        category: params.category,
        url: params.url,
        metadata: params.metadata,
      }),
    });

    if (!response.ok) {
      const error = (await response.text()).slice(0, 240);
      return {
        provider: "webhook",
        configured: true,
        attemptedCount: params.tokens.length,
        deliveredCount: 0,
        skippedCount: 0,
        failedCount: params.tokens.length,
        errors: [error || `Webhook returned HTTP ${response.status}`],
      };
    }

    return {
      provider: "webhook",
      configured: true,
      attemptedCount: params.tokens.length,
      deliveredCount: params.tokens.length,
      skippedCount: 0,
      failedCount: 0,
      errors: [],
    };
  } catch (error) {
    return {
      provider: "webhook",
      configured: true,
      attemptedCount: params.tokens.length,
      deliveredCount: 0,
      skippedCount: 0,
      failedCount: params.tokens.length,
      errors: [error instanceof Error ? error.message : "Webhook delivery failed"],
    };
  }
}

function oneSignalTokens(tokens: PushDeliveryToken[]) {
  return tokens.filter((token) => !token.token.trim().startsWith("{"));
}

async function deliverWithOneSignal(params: {
  appId: string;
  apiKey: string;
  tokens: PushDeliveryToken[];
  title: string;
  body: string;
  category?: string;
  url?: string;
  metadata?: DeliverPushParams["metadata"];
}): Promise<PushDeliverySummary> {
  const playerTokens = oneSignalTokens(params.tokens);
  const skippedCount = params.tokens.length - playerTokens.length;
  if (playerTokens.length === 0) {
    return emptySummary("onesignal", true, skippedCount, [
      "No OneSignal player tokens available for this recipient set",
    ]);
  }

  let deliveredCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (let index = 0; index < playerTokens.length; index += 2000) {
    const chunk = playerTokens.slice(index, index + 2000);
    try {
      const response = await postWithTimeout(
        "https://onesignal.com/api/v1/notifications",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${params.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            app_id: params.appId,
            include_player_ids: chunk.map((token) => token.token),
            headings: { en: params.title },
            contents: { en: params.body },
            url: params.url,
            data: {
              category: params.category,
              ...params.metadata,
            },
          }),
        },
      );

      if (response.ok) {
        deliveredCount += chunk.length;
        continue;
      }

      failedCount += chunk.length;
      if (errors.length < 5) {
        const detail = (await response.text()).slice(0, 240);
        errors.push(detail || `OneSignal returned HTTP ${response.status}`);
      }
    } catch (error) {
      failedCount += chunk.length;
      if (errors.length < 5) {
        errors.push(
          error instanceof Error ? error.message : "OneSignal delivery failed",
        );
      }
    }
  }

  return {
    provider: "onesignal",
    configured: true,
    attemptedCount: playerTokens.length,
    deliveredCount,
    skippedCount,
    failedCount,
    errors,
  };
}

export async function deliverPushNotification(
  params: DeliverPushParams,
): Promise<PushDeliverySummary> {
  const tokens = await deliveryTokens(params);
  if (tokens.length === 0) {
    return emptySummary("disabled", false, 0, ["No active push tokens"]);
  }

  const provider = deliveryProvider();
  if (provider === "disabled") {
    return emptySummary("disabled", false, tokens.length, [
      "Push delivery provider is not configured",
    ]);
  }

  if (provider === "webhook") {
    const webhookUrl = env("PUSH_DELIVERY_WEBHOOK_URL");
    if (!webhookUrl) {
      return emptySummary("webhook", false, tokens.length, [
        "Set PUSH_DELIVERY_WEBHOOK_URL to enable webhook push delivery",
      ]);
    }
    return deliverWithWebhook({
      webhookUrl,
      webhookToken: env("PUSH_DELIVERY_WEBHOOK_TOKEN"),
      tokens,
      title: params.title,
      body: params.body,
      category: params.category,
      url: params.url,
      metadata: params.metadata,
    });
  }

  const appId = env("ONESIGNAL_APP_ID");
  const apiKey = oneSignalApiKey();
  if (!appId || !apiKey) {
    return emptySummary("onesignal", false, tokens.length, [
      "Set ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY to enable OneSignal delivery",
    ]);
  }

  return deliverWithOneSignal({
    appId,
    apiKey,
    tokens,
    title: params.title,
    body: params.body,
    category: params.category,
    url: params.url,
    metadata: params.metadata,
  });
}

export function pushDeliveryAuditData(
  summary: PushDeliverySummary,
): PushDeliveryAudit {
  return {
    provider: summary.provider,
    configured: summary.configured,
    attemptedCount: summary.attemptedCount,
    deliveredCount: summary.deliveredCount,
    skippedCount: summary.skippedCount,
    failedCount: summary.failedCount,
    errors: summary.errors,
  };
}
