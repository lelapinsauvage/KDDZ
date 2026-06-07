export type EmailDeliveryRecipient = {
  email: string;
  name?: string | null;
};

export type EmailDeliverySummary = {
  provider: "disabled" | "resend" | "webhook";
  configured: boolean;
  attemptedCount: number;
  deliveredCount: number;
  skippedCount: number;
  failedCount: number;
  mode: "individual" | "bcc";
  errors: string[];
};

export type EmailDeliveryAudit = {
  provider: EmailDeliverySummary["provider"];
  configured: boolean;
  attemptedCount: number;
  deliveredCount: number;
  skippedCount: number;
  failedCount: number;
  mode: EmailDeliverySummary["mode"];
  errors: string[];
};

type DeliverEmailParams = {
  recipients: EmailDeliveryRecipient[];
  subject: string;
  body: string;
  category?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
  mode?: EmailDeliverySummary["mode"];
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function env(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function uniqueRecipients(recipients: EmailDeliveryRecipient[]) {
  const seen = new Set<string>();
  const unique: EmailDeliveryRecipient[] = [];

  for (const recipient of recipients) {
    const email = recipient.email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email) || seen.has(email)) continue;
    seen.add(email);
    unique.push({ email, name: recipient.name?.trim() || null });
  }

  return unique;
}

function htmlBody(body: string) {
  return /<[a-z][\s\S]*>/i.test(body)
    ? body
    : body
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\r?\n/g, "<br />");
}

function textBody(body: string) {
  return body
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function emptySummary(
  provider: EmailDeliverySummary["provider"],
  configured: boolean,
  skippedCount: number,
  mode: EmailDeliverySummary["mode"],
  errors: string[] = [],
): EmailDeliverySummary {
  return {
    provider,
    configured,
    attemptedCount: 0,
    deliveredCount: 0,
    skippedCount,
    failedCount: 0,
    mode,
    errors,
  };
}

function deliveryProvider(): EmailDeliverySummary["provider"] {
  const configured = env("EMAIL_DELIVERY_PROVIDER")?.toLowerCase();
  if (configured === "disabled") return "disabled";
  if (configured === "webhook") return "webhook";
  if (configured === "resend") return "resend";
  if (env("RESEND_API_KEY")) return "resend";
  if (env("EMAIL_DELIVERY_WEBHOOK_URL")) return "webhook";
  return "disabled";
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

async function deliverWithWebhook(params: {
  webhookUrl: string;
  webhookToken: string | null;
  from: string;
  recipients: EmailDeliveryRecipient[];
  subject: string;
  html: string;
  text: string;
  category?: string;
  metadata?: DeliverEmailParams["metadata"];
  mode: EmailDeliverySummary["mode"];
}): Promise<EmailDeliverySummary> {
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
        from: params.from,
        recipients: params.recipients,
        subject: params.subject,
        html: params.html,
        text: params.text,
        category: params.category,
        metadata: params.metadata,
        mode: params.mode,
      }),
    });

    if (!response.ok) {
      const error = (await response.text()).slice(0, 240);
      return {
        provider: "webhook",
        configured: true,
        attemptedCount: params.recipients.length,
        deliveredCount: 0,
        skippedCount: 0,
        failedCount: params.recipients.length,
        mode: params.mode,
        errors: [error || `Webhook returned HTTP ${response.status}`],
      };
    }

    return {
      provider: "webhook",
      configured: true,
      attemptedCount: params.recipients.length,
      deliveredCount: params.recipients.length,
      skippedCount: 0,
      failedCount: 0,
      mode: params.mode,
      errors: [],
    };
  } catch (error) {
    return {
      provider: "webhook",
      configured: true,
      attemptedCount: params.recipients.length,
      deliveredCount: 0,
      skippedCount: 0,
      failedCount: params.recipients.length,
      mode: params.mode,
      errors: [error instanceof Error ? error.message : "Webhook delivery failed"],
    };
  }
}

async function deliverWithResend(params: {
  apiKey: string;
  from: string;
  recipients: EmailDeliveryRecipient[];
  subject: string;
  html: string;
  text: string;
  category?: string;
  metadata?: DeliverEmailParams["metadata"];
  mode: EmailDeliverySummary["mode"];
}): Promise<EmailDeliverySummary> {
  let deliveredCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const recipient of params.recipients) {
    try {
      const response = await postWithTimeout("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: params.from,
          to: [recipient.email],
          subject: params.subject,
          html: params.html,
          text: params.text,
          tags: params.category
            ? [{ name: "category", value: params.category.toLowerCase() }]
            : undefined,
          headers: {
            "X-KiddzOnline-Delivery-Mode": params.mode,
            ...(params.metadata?.source
              ? { "X-KiddzOnline-Source": String(params.metadata.source) }
              : {}),
          },
        }),
      });

      if (response.ok) {
        deliveredCount += 1;
        continue;
      }

      failedCount += 1;
      if (errors.length < 5) {
        const detail = (await response.text()).slice(0, 240);
        errors.push(
          `${recipient.email}: ${detail || `Resend returned HTTP ${response.status}`}`,
        );
      }
    } catch (error) {
      failedCount += 1;
      if (errors.length < 5) {
        errors.push(
          `${recipient.email}: ${
            error instanceof Error ? error.message : "Resend delivery failed"
          }`,
        );
      }
    }
  }

  return {
    provider: "resend",
    configured: true,
    attemptedCount: params.recipients.length,
    deliveredCount,
    skippedCount: 0,
    failedCount,
    mode: params.mode,
    errors,
  };
}

export async function deliverEmail(
  params: DeliverEmailParams,
): Promise<EmailDeliverySummary> {
  const mode = params.mode ?? "individual";
  const recipients = uniqueRecipients(params.recipients);
  if (recipients.length === 0) {
    return emptySummary("disabled", false, 0, mode, ["No valid recipients"]);
  }

  const provider = deliveryProvider();
  if (provider === "disabled") {
    return emptySummary("disabled", false, recipients.length, mode, [
      "Email delivery provider is not configured",
    ]);
  }

  const from =
    env("EMAIL_FROM") ??
    env("MAIL_FROM") ??
    env("RESEND_FROM_EMAIL") ??
    env("SMTP_FROM");
  if (!from) {
    return emptySummary(provider, false, recipients.length, mode, [
      "Set EMAIL_FROM to enable external email delivery",
    ]);
  }

  const subject = params.subject.trim();
  const html = htmlBody(params.body);
  const text = textBody(params.body);

  if (provider === "webhook") {
    const webhookUrl = env("EMAIL_DELIVERY_WEBHOOK_URL");
    if (!webhookUrl) {
      return emptySummary("webhook", false, recipients.length, mode, [
        "Set EMAIL_DELIVERY_WEBHOOK_URL to enable webhook email delivery",
      ]);
    }
    return deliverWithWebhook({
      webhookUrl,
      webhookToken: env("EMAIL_DELIVERY_WEBHOOK_TOKEN"),
      from,
      recipients,
      subject,
      html,
      text,
      category: params.category,
      metadata: params.metadata,
      mode,
    });
  }

  const apiKey = env("RESEND_API_KEY");
  if (!apiKey) {
    return emptySummary("resend", false, recipients.length, mode, [
      "Set RESEND_API_KEY to enable Resend email delivery",
    ]);
  }

  return deliverWithResend({
    apiKey,
    from,
    recipients,
    subject,
    html,
    text,
    category: params.category,
    metadata: params.metadata,
    mode,
  });
}

export function emailDeliveryAuditData(
  summary: EmailDeliverySummary,
): EmailDeliveryAudit {
  return {
    provider: summary.provider,
    configured: summary.configured,
    attemptedCount: summary.attemptedCount,
    deliveredCount: summary.deliveredCount,
    skippedCount: summary.skippedCount,
    failedCount: summary.failedCount,
    mode: summary.mode,
    errors: summary.errors,
  };
}
