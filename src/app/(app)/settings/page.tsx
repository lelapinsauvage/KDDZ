import { requireRole } from "@/lib/require-role";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  CalendarOff,
  CalendarDays,
  FileDown,
  MapPin,
  Map,
  LayoutGrid,
  Users,
  Bell,
  BellRing,
  Landmark,
} from "lucide-react";

const sections = [
  {
    title: "Nursery Info",
    description: "Name, contact, working hours, defaults",
    href: "/settings/nursery",
    icon: Building2,
    iconBg: "bg-[#C35A2C]/10",
    iconColor: "text-[#C35A2C]",
  },
  {
    title: "Holidays",
    description: "Public holidays and closures",
    href: "/settings/holidays",
    icon: CalendarOff,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
  },
  {
    title: "Events",
    description: "School events and activities",
    href: "/settings/events",
    icon: CalendarDays,
    iconBg: "bg-[#8B7355]/15",
    iconColor: "text-[#8B7355]",
  },
  {
    title: "Regions",
    description: "Geographic regions",
    href: "/settings/regions",
    icon: MapPin,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    title: "Zones",
    description: "Zones within regions",
    href: "/settings/zones",
    icon: Map,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
  },
  {
    title: "Areas",
    description: "Areas within zones",
    href: "/settings/areas",
    icon: LayoutGrid,
    iconBg: "bg-[#6B8F71]/15",
    iconColor: "text-[#6B8F71]",
  },
  {
    title: "Parent Users",
    description: "Parent accounts and access",
    href: "/settings/parent-users",
    icon: Users,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    title: "Export Data",
    description: "Download reports and backups",
    href: "/settings/export",
    icon: FileDown,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    title: "Alarm Settings",
    description: "Configure notification rules",
    href: "/alarms/settings",
    icon: Bell,
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
  },
  {
    title: "Notification Settings",
    description: "Auto-notifications, templates & scheduling",
    href: "/settings/notifications",
    icon: BellRing,
    iconBg: "bg-[#8B7355]/15",
    iconColor: "text-[#8B7355]",
  },
];

const adminOnlySections = [
  {
    title: "Organizations",
    description: "Manage nursery organizations",
    href: "/settings/organizations",
    icon: Landmark,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
];

export default async function SettingsPage() {
  const ctx = await requireRole("ADMIN", "MANAGER");
  const allSections =
    ctx.role === "ADMIN" ? [...adminOnlySections, ...sections] : sections;

  return (
    <>
      <PageHeader
        title="Settings"
        breadcrumbs={[{ label: "Settings" }]}
      />
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allSections.map((section) => {
            const Icon = section.icon;
            return (
              <Link key={section.href} href={section.href}>
                <Card className="group cursor-pointer py-4 transition-all hover:shadow-md hover:-translate-y-0.5">
                  <CardContent className="flex items-center gap-4">
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${section.iconBg}`}>
                      <Icon className={`size-5 ${section.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {section.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
