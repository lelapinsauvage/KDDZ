/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

type PushPayload = {
  title?: string;
  body?: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: Record<string, unknown>;
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

self.addEventListener("push", (event) => {
  const payload = readPushPayload(event);
  const targetUrl = normalizeNotificationUrl(payload.url);

  event.waitUntil(
    self.registration.showNotification(payload.title || "KiddzOnline", {
      body: payload.body || "",
      icon: payload.icon || "/icon-192.svg",
      badge: payload.badge || "/icon-192.svg",
      data: {
        ...(payload.data ?? {}),
        url: targetUrl,
      },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data as { url?: unknown } | undefined;
  const targetUrl = normalizeNotificationUrl(data?.url);

  event.waitUntil(focusOrOpenWindow(targetUrl));
});

serwist.addEventListeners();

function readPushPayload(event: PushEvent): PushPayload {
  if (!event.data) return {};

  try {
    const payload = event.data.json();
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      return payload as PushPayload;
    }
  } catch {
    const body = event.data.text();
    if (body) return { body };
  }

  return {};
}

function normalizeNotificationUrl(value: unknown) {
  if (typeof value === "string" && value.startsWith("/")) return value;

  if (typeof value === "string") {
    try {
      const url = new URL(value);
      if (url.origin === self.location.origin) {
        return `${url.pathname}${url.search}${url.hash}`;
      }
    } catch {
      return "/parent";
    }
  }

  return "/parent";
}

async function focusOrOpenWindow(path: string) {
  const targetUrl = new URL(path, self.location.origin).href;
  const windowClients = await self.clients.matchAll({
    includeUncontrolled: true,
    type: "window",
  });

  for (const client of windowClients) {
    const windowClient = client as WindowClient;
    if (windowClient.url === targetUrl && "focus" in windowClient) {
      return windowClient.focus();
    }
  }

  return self.clients.openWindow(targetUrl);
}
