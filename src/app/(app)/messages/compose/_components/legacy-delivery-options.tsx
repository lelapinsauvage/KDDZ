"use client";

import { Bell, MessageSquare, ShieldCheck, Smartphone, Wifi } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface LegacyDeliveryOptions {
  web: boolean;
  mobile: boolean;
  sms: boolean;
  whatsapp: boolean;
  adminOnly?: boolean;
}

export const DEFAULT_LEGACY_DELIVERY_OPTIONS: LegacyDeliveryOptions = {
  web: true,
  mobile: true,
  sms: false,
  whatsapp: false,
  adminOnly: false,
};

interface LegacyDeliveryOptionsProps {
  value: LegacyDeliveryOptions;
  onChange: (value: LegacyDeliveryOptions) => void;
  showAdminOnly?: boolean;
  className?: string;
}

const CHANNELS = [
  { key: "web", label: "Web", icon: Wifi, locked: true },
  { key: "mobile", label: "Mobile", icon: Bell },
  { key: "sms", label: "SMS", icon: Smartphone },
  { key: "whatsapp", label: "WhatsApp", icon: MessageSquare },
] as const;

export function LegacyDeliveryOptionsField({
  value,
  onChange,
  showAdminOnly = false,
  className,
}: LegacyDeliveryOptionsProps) {
  function setChannel(key: keyof LegacyDeliveryOptions, checked: boolean) {
    onChange({ ...value, web: true, [key]: checked });
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2">
        {CHANNELS.map((channel) => {
          const Icon = channel.icon;
          const checked = channel.key === "web" ? true : Boolean(value[channel.key]);
          return (
            <label
              key={channel.key}
              className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm"
            >
              <Checkbox
                checked={checked}
                disabled={"locked" in channel && channel.locked}
                onCheckedChange={(next) =>
                  setChannel(channel.key, next === true)
                }
              />
              <Icon className="size-3.5 text-muted-foreground" />
              <span>{channel.label}</span>
            </label>
          );
        })}
        {showAdminOnly && (
          <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
            <Checkbox
              checked={Boolean(value.adminOnly)}
              onCheckedChange={(next) => setChannel("adminOnly", next === true)}
            />
            <ShieldCheck className="size-3.5 text-muted-foreground" />
            <span>Admin Only</span>
          </label>
        )}
      </div>
    </div>
  );
}
