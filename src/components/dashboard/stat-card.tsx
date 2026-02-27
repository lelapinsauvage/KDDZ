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

const colorStyles: Record<StatCardColor, { bg: string; icon: string; text: string }> = {
  teal:    { bg: "bg-card", icon: "text-[#C35A2C] bg-[#C35A2C]/10", text: "text-[#C35A2C]" },
  blue:    { bg: "bg-card", icon: "text-[#6B8F71] bg-[#6B8F71]/10", text: "text-[#6B8F71]" },
  purple:  { bg: "bg-card", icon: "text-[#8B7355] bg-[#8B7355]/10", text: "text-[#8B7355]" },
  rose:    { bg: "bg-card", icon: "text-[#B07070] bg-[#B07070]/10", text: "text-[#B07070]" },
  amber:   { bg: "bg-card", icon: "text-[#B08968] bg-[#B08968]/10", text: "text-[#B08968]" },
  orange:  { bg: "bg-card", icon: "text-[#B87333] bg-[#B87333]/10", text: "text-[#B87333]" },
  sky:     { bg: "bg-card", icon: "text-[#5B7B5E] bg-[#5B7B5E]/10", text: "text-[#5B7B5E]" },
  emerald: { bg: "bg-card", icon: "text-[#6B8F71] bg-[#6B8F71]/10", text: "text-[#6B8F71]" },
};

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: StatCardColor;
  href?: string;
}

export function StatCard({ title, value, icon: Icon, color, href }: StatCardProps) {
  const styles = colorStyles[color];

  const content = (
    <div className={`rounded-2xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] ${href ? "cursor-pointer" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>
          <p className={`text-3xl font-semibold tracking-tight ${styles.text}`}>{value}</p>
        </div>
        <div className={`flex size-11 items-center justify-center rounded-xl ${styles.icon}`}>
          <Icon className="size-5" />
        </div>
      </div>
      {href && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <span className={`text-xs font-medium ${styles.text}`}>
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
