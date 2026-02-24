"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  id?: string;
  title: string;
  subtitle?: string;
  color?: "blue" | "green" | "yellow" | "purple" | "teal" | "red";
  collapsible?: boolean;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}

const colorMap: Record<string, string> = {
  blue: "border-t-blue-400",
  green: "border-t-emerald-400",
  yellow: "border-t-amber-400",
  purple: "border-t-violet-400",
  teal: "border-t-teal-400",
  red: "border-t-rose-400",
};

export function FormSection({
  id,
  title,
  subtitle,
  color = "blue",
  collapsible = false,
  defaultOpen = true,
  badge,
  children,
}: FormSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      id={id}
      className={cn(
        "rounded-2xl border bg-card border-t-4 shadow-sm",
        colorMap[color],
      )}
    >
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-between border-b bg-muted/50 px-4 py-3 rounded-t-2xl",
          collapsible && "cursor-pointer hover:bg-muted/80",
          !collapsible && "cursor-default",
        )}
        onClick={() => collapsible && setIsOpen(!isOpen)}
        tabIndex={collapsible ? 0 : -1}
      >
        <div className="flex items-center gap-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground" dir="rtl">{subtitle}</p>
            )}
          </div>
          {badge}
        </div>
        {collapsible && (
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              !isOpen && "-rotate-90",
            )}
          />
        )}
      </button>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  );
}
