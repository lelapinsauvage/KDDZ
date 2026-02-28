import { type LucideIcon } from "lucide-react";
import Link from "next/link";

export type StatCardColor =
  | "teal"
  | "blue"
  | "purple"
  | "rose"
  | "amber"
  | "orange"
  | "sky"
  | "emerald";

/* Module-accent color mapping from design system */
const colorStyles: Record<
  StatCardColor,
  { icon: string; iconBg: string; value: string; accent: string }
> = {
  teal: {
    icon: "text-[#0B9178]",
    iconBg: "bg-[#EFFCF8]",
    value: "text-[#0B7464]",
    accent: "bg-[#0B9178]",
  },
  blue: {
    icon: "text-[#2563EB]",
    iconBg: "bg-[#EFF6FF]",
    value: "text-[#1D4ED8]",
    accent: "bg-[#2563EB]",
  },
  purple: {
    icon: "text-[#7C3AED]",
    iconBg: "bg-[#F5F3FF]",
    value: "text-[#7C3AED]",
    accent: "bg-[#7C3AED]",
  },
  rose: {
    icon: "text-[#E11D48]",
    iconBg: "bg-[#FFF1F2]",
    value: "text-[#E11D48]",
    accent: "bg-[#E11D48]",
  },
  amber: {
    icon: "text-[#D97706]",
    iconBg: "bg-[#FFFBEB]",
    value: "text-[#B45309]",
    accent: "bg-[#D97706]",
  },
  orange: {
    icon: "text-[#EA580C]",
    iconBg: "bg-[#FFF7ED]",
    value: "text-[#EA580C]",
    accent: "bg-[#EA580C]",
  },
  sky: {
    icon: "text-[#0284C7]",
    iconBg: "bg-[#F0F9FF]",
    value: "text-[#0284C7]",
    accent: "bg-[#0284C7]",
  },
  emerald: {
    icon: "text-[#059669]",
    iconBg: "bg-[#ECFDF5]",
    value: "text-[#059669]",
    accent: "bg-[#059669]",
  },
};

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: StatCardColor;
  href?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  color,
  href,
}: StatCardProps) {
  const styles = colorStyles[color];

  const content = (
    <div
      className={`group relative overflow-hidden rounded-xl border border-border bg-card p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[0_4px_6px_rgba(15,23,42,0.06),0_2px_4px_rgba(15,23,42,0.04)] hover:-translate-y-0.5 ${href ? "cursor-pointer" : ""}`}
    >
      {/* Top accent bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-[3px] ${styles.accent} opacity-80`}
      />

      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium text-muted-foreground">
            {title}
          </p>
          <p
            className={`text-2xl sm:text-3xl font-bold tracking-tight font-heading ${styles.value}`}
          >
            {value}
          </p>
        </div>
        <div
          className={`flex size-11 items-center justify-center rounded-xl ${styles.iconBg}`}
        >
          <Icon className={`size-5 ${styles.icon}`} />
        </div>
      </div>

      {href && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <span
            className={`text-xs font-medium ${styles.icon} group-hover:underline`}
          >
            View details &rarr;
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
