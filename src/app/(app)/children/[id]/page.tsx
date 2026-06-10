import { notFound } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Baby,
  Banknote,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  Home,
  MapPin,
  Pencil,
  Phone,
  Printer,
  School,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getChild } from "@/lib/actions/children";

interface Props {
  params: Promise<{ id: string }>;
}

type ChildRecord = NonNullable<Awaited<ReturnType<typeof getChild>>>;
type ParentRecord = ChildRecord["parents"][number];
type AddressRecord = ChildRecord["addresses"][number];
type SiblingRecord = ChildRecord["siblings"][number];
type RelativeRecord = ChildRecord["relatives"][number];
type AccountingEntryRecord = ChildRecord["accountingEntries"][number];
type AttachmentRecord = ChildRecord["attachments"][number];
type PreviousGarderieRecord = ChildRecord["previousGarderies"][number];

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "-";
  const parsed = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(date: Date | string | null | undefined) {
  if (!date) return "-";
  const parsed = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(parsed.getTime())) return "-";
  const hours = String(parsed.getUTCHours()).padStart(2, "0");
  const minutes = String(parsed.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatMoney(value: unknown) {
  const amount = Number(value ?? 0);
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function yesNo(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) return "Yes";
  if (["false", "0", "no", "n"].includes(normalized)) return "No";
  return String(value);
}

function calculateAge(date: Date | string | null | undefined) {
  if (!date) return "-";
  const birth = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(birth.getTime())) return "-";
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
    years -= 1;
    months += 12;
  }
  if (now.getDate() < birth.getDate()) {
    months -= 1;
    if (months < 0) months += 12;
  }
  if (years <= 0) return `${Math.max(0, months)}m`;
  return `${years}y ${Math.max(0, months)}m`;
}

function displayName(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(" ") || "-";
}

const AVATAR_COLORS = [
  "bg-primary",
  "bg-[#D97706]",
  "bg-[#4F46E5]",
  "bg-[#059669]",
  "bg-[#EA580C]",
  "bg-[#0284C7]",
  "bg-[#E11D48]",
  "bg-[#7C3AED]",
  "bg-[#2563EB]",
  "bg-[#9333EA]",
] as const;

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function completionStatus(child: ChildRecord) {
  const hasMother = child.parents.some((parent) => parent.type === "MOTHER");
  const hasFather = child.parents.some((parent) => parent.type === "FATHER");
  const mandatory = [
    child.firstName,
    child.lastName,
    child.dateOfBirth,
    child.gender,
    child.branchId,
    child.classId,
    child.enrollmentDate,
    hasMother,
    hasFather,
    child.addresses.length > 0,
  ];
  const full = [
    ...mandatory,
    child.childNumber,
    child.placeOfBirth,
    child.nationality,
    child.language,
    child.bloodType,
    child.parents.some((parent) => parent.mobile || parent.phone || parent.email),
    child.relatives.some((relative) => relative.isAuthorized),
    child.garderieFees || child.accountingEntries.length > 0,
    child.attachments.length > 0,
  ];

  if (mandatory.some((value) => !value)) {
    return {
      label: "Form Not Filled Completely",
      tone: "bg-[#d64635] text-white",
      icon: XCircle,
    };
  }
  if (full.every(Boolean)) {
    return {
      label: "Form Filled Completely",
      tone: "bg-[#008200] text-white",
      icon: CheckCircle2,
    };
  }
  return {
    label: "Mandatory Filled Completely",
    tone: "bg-[#c29d0b] text-white",
    icon: AlertTriangle,
  };
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-0 border-b border-border/50 py-2 last:border-b-0">
      <div className="text-[11px] font-semibold uppercase text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 break-words text-sm font-medium text-foreground">
        {value || "-"}
      </div>
    </div>
  );
}

function DetailGrid({
  items,
}: {
  items: Array<[string, React.ReactNode]>;
}) {
  return (
    <div className="grid gap-x-6 sm:grid-cols-2 xl:grid-cols-3">
      {items.map(([label, value]) => (
        <DetailItem key={label} label={label} value={value} />
      ))}
    </div>
  );
}

function DossierSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Baby;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded border border-border/60 bg-card">
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
        <Icon className="size-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function ParentCard({ parent }: { parent: ParentRecord }) {
  return (
    <div className="rounded border border-border/60 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">
            {displayName([parent.firstName, parent.lastName])}
          </p>
          <p className="text-xs text-muted-foreground">{parent.type}</p>
        </div>
        <Badge variant={parent.canPickUp ? "success" : "secondary"}>
          Pickup: {yesNo(parent.canPickUp)}
        </Badge>
      </div>
      <DetailGrid
        items={[
          ["Mobile", parent.mobile ?? "-"],
          ["Telephone", parent.phone ?? "-"],
          ["Email", parent.email ?? "-"],
          ["Profession", parent.profession ?? "-"],
          ["Workplace", parent.workplace ?? "-"],
          ["Work Telephone", parent.workPhone ?? "-"],
          ["Nationality", parent.nationality ?? "-"],
          ["Marital Status", parent.maritalStatus ?? "-"],
          ["Situation", parent.divorceSituation ?? "-"],
          ["Medical Case", parent.medicalCase ?? "-"],
          ["ID Number", parent.idNumber ?? "-"],
        ]}
      />
    </div>
  );
}

function AddressCard({ address }: { address: AddressRecord }) {
  return (
    <div className="rounded border border-border/60 p-3">
      <DetailGrid
        items={[
          ["Type", address.addressType ?? "-"],
          ["Country", address.country ?? "-"],
          ["Street", address.street ?? "-"],
          ["Building", address.building ?? "-"],
          ["Floor", address.floor ?? "-"],
          ["City", address.city ?? "-"],
          ["Region", address.region?.name ?? "-"],
          ["Telephone", address.telephone ?? "-"],
        ]}
      />
    </div>
  );
}

function SiblingCard({ sibling }: { sibling: SiblingRecord }) {
  return (
    <div className="rounded border border-border/60 p-3">
      <DetailGrid
        items={[
          ["Relation", sibling.relation ?? "-"],
          ["First Name", sibling.firstName ?? "-"],
          ["Date Of Birth", formatDate(sibling.dateOfBirth)],
          ["Medical Case", sibling.medicalCase ?? "-"],
          ["Can Pick Up", yesNo(sibling.canPickUp)],
        ]}
      />
    </div>
  );
}

function RelativeCard({ relative }: { relative: RelativeRecord }) {
  return (
    <div className="rounded border border-border/60 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">
            {displayName([relative.name, relative.lastName])}
          </p>
          <p className="text-xs text-muted-foreground">
            {relative.relation || "Authorized person"}
          </p>
        </div>
        <div className="flex gap-1">
          {relative.isAuthorized && <Badge variant="success">Pickup</Badge>}
          {relative.isEmergencyContact && <Badge variant="warning">Emergency</Badge>}
        </div>
      </div>
      <DetailGrid
        items={[
          ["Telephone", relative.phone ?? "-"],
          ["Mobile", relative.mobile ?? "-"],
          ["Authorized", yesNo(relative.isAuthorized)],
          ["Emergency Contact", yesNo(relative.isEmergencyContact)],
        ]}
      />
    </div>
  );
}

function AccountingRow({ entry }: { entry: AccountingEntryRecord }) {
  return (
    <div className="grid gap-2 border-b border-border/50 py-2 text-sm last:border-b-0 sm:grid-cols-[1fr_auto_auto]">
      <span className="font-medium">{entry.description || entry.type}</span>
      <span className="text-muted-foreground">{entry.type}</span>
      <span className="font-semibold">{formatMoney(entry.amount)}</span>
    </div>
  );
}

function AttachmentCard({ attachment }: { attachment: AttachmentRecord }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded border border-border/60 p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">
          {attachment.title || attachment.filename}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {attachment.type || attachment.filename}
        </p>
      </div>
      <Button variant="outline" size="sm" asChild>
        <a href={attachment.fileUrl} target="_blank" rel="noreferrer">
          <Download className="size-3.5" />
          Open
        </a>
      </Button>
    </div>
  );
}

function PreviousGarderieCard({
  garderie,
}: {
  garderie: PreviousGarderieRecord;
}) {
  return (
    <div className="rounded border border-border/60 p-3">
      <DetailGrid
        items={[
          ["Name", garderie.name ?? "-"],
          ["Year", garderie.year ?? "-"],
          ["Active", yesNo(garderie.isActive)],
        ]}
      />
    </div>
  );
}

export default async function ChildDetailPage({ params }: Props) {
  const { id } = await params;
  const child = await getChild(id);

  if (!child) {
    notFound();
  }

  const status = completionStatus(child);
  const StatusIcon = status.icon;
  const initials = getInitials(child.firstName, child.lastName);
  const avatarBg = getAvatarColor(`${child.firstName} ${child.lastName}`);
  const mother = child.parents.find((parent) => parent.type === "MOTHER");
  const father = child.parents.find((parent) => parent.type === "FATHER");
  const authorizedPeople = child.relatives.filter(
    (relative) => relative.isAuthorized || relative.isEmergencyContact
  );
  const previousGarderies = child.previousGarderies.length
    ? child.previousGarderies
    : child.previousGarderie || child.previousGarderieName
      ? [
          {
            id: "current",
            name: child.previousGarderieName,
            year: "-",
            isActive: child.previousGarderie,
          } as PreviousGarderieRecord,
        ]
      : [];

  return (
    <>
      <PageHeader
        title="Child Details"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Children", href: "/children" },
          { label: displayName([child.firstName, child.lastName]) },
        ]}
      />

      <div className="space-y-6 p-4 md:p-6">
        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <aside className="space-y-4">
            <section className="overflow-hidden rounded border border-border/60 bg-card">
              <div className="h-16 bg-primary" />
              <div className="px-4 pb-4">
                <div className="-mt-10 flex justify-center">
                  <div
                    className={`flex size-24 items-center justify-center overflow-hidden rounded-full text-2xl font-bold text-white ring-4 ring-background ${avatarBg}`}
                  >
                    {child.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={child.photo}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                </div>

                <div className="mt-3 text-center">
                  <h1 className="text-lg font-semibold leading-tight">
                    {displayName([child.firstName, child.middleName, child.lastName])}
                  </h1>
                  {child.firstNameAr || child.lastNameAr ? (
                    <p className="text-sm text-muted-foreground">
                      {displayName([child.firstNameAr, child.lastNameAr])}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                    <Badge className={status.tone}>
                      <StatusIcon className="size-3" />
                      {status.label}
                    </Badge>
                    {child.isDraft ? (
                      <Badge variant="warning">Draft</Badge>
                    ) : child.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded border border-border/60 px-2 py-2">
                    <p className="text-[11px] uppercase text-muted-foreground">
                      Child No.
                    </p>
                    <p className="truncate text-sm font-semibold">
                      {child.childNumber || "-"}
                    </p>
                  </div>
                  <div className="rounded border border-border/60 px-2 py-2">
                    <p className="text-[11px] uppercase text-muted-foreground">
                      Age
                    </p>
                    <p className="truncate text-sm font-semibold">
                      {calculateAge(child.dateOfBirth)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2">
                  <Button size="sm" asChild>
                    <Link href={`/children/${id}/edit`}>
                      <Pencil className="size-3.5" />
                      Edit Profile
                    </Link>
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/children/${id}/print`}>
                        <Printer className="size-3.5" />
                        Print
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/children/${id}/dashboard`}>
                        <BookOpen className="size-3.5" />
                        Dashboard
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded border border-border/60 bg-card p-4">
              <h2 className="mb-3 text-sm font-semibold">Quick Actions</h2>
              <div className="grid gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/daily-reports/new?childId=${id}`}>
                    <FileText className="size-3.5" />
                    Daily Report
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/absent-reports/new?childId=${id}`}>
                    <CalendarDays className="size-3.5" />
                    Absence Report
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/children/${id}/calls`}>
                    <Phone className="size-3.5" />
                    Calls
                  </Link>
                </Button>
              </div>
            </section>
          </aside>

          <main className="min-w-0 space-y-4">
            <DossierSection title="Child Info" icon={Baby}>
              <DetailGrid
                items={[
                  ["First Name", child.firstName],
                  ["Middle Name", child.middleName ?? "-"],
                  ["Last Name", child.lastName],
                  ["Date Of Birth", formatDate(child.dateOfBirth)],
                  ["Place Of Birth", child.placeOfBirth ?? "-"],
                  ["Gender", child.gender ?? "-"],
                  ["Nationality", child.nationality ?? "-"],
                  ["Mother's Name", displayName([mother?.firstName, mother?.lastName])],
                  ["Mother Nationality", mother?.nationality ?? "-"],
                  ["Branch", child.branch?.name ?? "-"],
                  ["Class", child.class?.name ?? "-"],
                  ["School Year", child.schoolYear?.label ?? "-"],
                  ["Language", child.language ?? "-"],
                  ["Joining Date", formatDate(child.enrollmentDate)],
                  ["Child Number", child.childNumber ?? "-"],
                  ["Remarks", child.remarks ?? "-"],
                ]}
              />
            </DossierSection>

            <DossierSection title="General Care" icon={Stethoscope}>
              <DetailGrid
                items={[
                  ["Active", yesNo(child.isActive)],
                  ["Blood Type", child.bloodType ?? "-"],
                  ["Allergy", child.allergies ?? "-"],
                  ["Bus", yesNo(child.busAttendance)],
                  ["Diapers", child.diaperType ?? "-"],
                  ["Lunch", yesNo(child.lunchIncluded)],
                  ["Milk Brand", child.milkType ?? "-"],
                  ["Milk Portion", child.milkPortions ?? "-"],
                  ["Milk Scoop", child.milkScoop ?? "-"],
                  ["Milk Time 1", formatTime(child.milkTime1)],
                  ["Milk Time 2", formatTime(child.milkTime2)],
                  ["Milk Time 3", formatTime(child.milkTime3)],
                  ["Sleep From", formatTime(child.sleepFrom)],
                  ["Sleep To", formatTime(child.sleepTo)],
                  ["Previous Garderie", yesNo(child.previousGarderie)],
                ]}
              />
            </DossierSection>

            <DossierSection title="Address" icon={MapPin}>
              {child.addresses.length ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {child.addresses.map((address) => (
                    <AddressCard key={address.id} address={address} />
                  ))}
                </div>
              ) : (
                <EmptyState label="No address records." />
              )}
            </DossierSection>

            <DossierSection title="Parents" icon={Users}>
              {child.parents.length ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {father ? <ParentCard parent={father} /> : null}
                  {mother ? <ParentCard parent={mother} /> : null}
                  {child.parents
                    .filter((parent) => parent.type !== "FATHER" && parent.type !== "MOTHER")
                    .map((parent) => (
                      <ParentCard key={parent.id} parent={parent} />
                    ))}
                </div>
              ) : (
                <EmptyState label="No parent records." />
              )}
            </DossierSection>

            <DossierSection title="Brothers And Sisters" icon={Baby}>
              {child.siblings.length ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {child.siblings.map((sibling) => (
                    <SiblingCard key={sibling.id} sibling={sibling} />
                  ))}
                </div>
              ) : (
                <EmptyState label="No brother or sister records." />
              )}
            </DossierSection>

            <DossierSection title="Authorized Person" icon={ShieldCheck}>
              {authorizedPeople.length ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {authorizedPeople.map((relative) => (
                    <RelativeCard key={relative.id} relative={relative} />
                  ))}
                </div>
              ) : (
                <EmptyState label="No authorized pickup records." />
              )}
            </DossierSection>

            <DossierSection title="Previous Garderie" icon={School}>
              {previousGarderies.length ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {previousGarderies.map((garderie) => (
                    <PreviousGarderieCard
                      key={garderie.id}
                      garderie={garderie}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState label="No previous garderie records." />
              )}
            </DossierSection>

            <DossierSection title="Accounting" icon={Banknote}>
              <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <DetailItem label="Garderie Fees" value={formatMoney(child.garderieFees)} />
                <DetailItem label="Extra Fees" value={formatMoney(child.extraFees)} />
                <DetailItem label="Bus Fees" value={formatMoney(child.busFees)} />
                <DetailItem label="Apron Fees" value={formatMoney(child.apronFees)} />
                <DetailItem label="Registration Fees" value={formatMoney(child.registrationFees)} />
                <DetailItem label="Activities Fees" value={formatMoney(child.activitiesFees)} />
                <DetailItem label="Discount" value={formatMoney(child.discount)} />
                <DetailItem label="TVA" value={`${Number(child.tva ?? 0)}%`} />
                <DetailItem label="Remarks" value={child.financialRemarks ?? "-"} />
              </div>
              {child.accountingEntries.length ? (
                <div className="rounded border border-border/60 px-3">
                  {child.accountingEntries.map((entry) => (
                    <AccountingRow key={entry.id} entry={entry} />
                  ))}
                </div>
              ) : (
                <EmptyState label="No accounting entries." />
              )}
            </DossierSection>

            <DossierSection title="Attachments" icon={FileText}>
              {child.attachments.length ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {child.attachments.map((attachment) => (
                    <AttachmentCard
                      key={attachment.id}
                      attachment={attachment}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState label="No attachments." />
              )}
            </DossierSection>

            <DossierSection title="Current Location" icon={Home}>
              <DetailGrid
                items={[
                  ["Branch", child.branch?.name ?? "-"],
                  ["Class", child.class?.name ?? "-"],
                  ["School Year", child.schoolYear?.label ?? "-"],
                  ["Updated At", formatDate(child.updatedAt)],
                  ["Created At", formatDate(child.createdAt)],
                ]}
              />
            </DossierSection>

            <div className="flex justify-end">
              <Button asChild>
                <Link href={`/children/${id}/edit`}>
                  <UserCheck className="size-4" />
                  Update Child
                </Link>
              </Button>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
