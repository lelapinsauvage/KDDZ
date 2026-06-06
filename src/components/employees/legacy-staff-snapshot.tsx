"use client";

import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FieldValue = string | number | boolean | null | undefined;

interface LegacyAddress {
  id: string;
  governorate?: string | null;
  district?: string | null;
  region?: string | null;
  city?: string | null;
  street?: string | null;
  building?: string | null;
}

interface LegacyLanguage {
  id: string;
  language: string;
  canRead: string;
  canWrite: string;
  canSpeak: string;
}

export interface LegacyStaffSnapshotStaff {
  id: string;
  sourceDatabase?: string | null;
  legacyKey?: string | null;
  legacyId?: number | null;
  legacyTable?: string | null;
  legacyUserId?: number | null;
  userId?: string | null;
  username?: string | null;
  firstName: string;
  firstNameAr?: string | null;
  middleName?: string | null;
  middleNameAr?: string | null;
  lastName: string;
  lastNameAr?: string | null;
  imageUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  telephone?: string | null;
  mobile?: string | null;
  nationality?: string | null;
  dateOfBirth?: string | null;
  placeOfBirth?: string | null;
  registerNumber?: string | null;
  licenseNumber?: string | null;
  maritalStatus?: string | null;
  numberOfChildren?: number | null;
  gender?: string | null;
  medicalCase?: boolean | null;
  medicalCaseDescription?: string | null;
  cnss?: string | null;
  cnssNo?: string | null;
  secondaryDegree?: string | null;
  secondaryDegreeYear?: string | null;
  universityDegree?: string | null;
  universityDegreeYear?: string | null;
  hireDate?: string | null;
  specialization?: string | null;
  remarks?: string | null;
  isActive: boolean;
  branch: { id: string; name: string; legacyId?: number | null };
  class?: { id: string; name: string | null } | null;
  addresses: LegacyAddress[];
  languages?: LegacyLanguage[];
}

interface LegacyStaffSnapshotProps {
  role: "Teacher" | "Nurse" | "Doctor" | "Manager";
  staff: LegacyStaffSnapshotStaff;
}

interface FieldItem {
  label: string;
  value: FieldValue;
  dir?: "ltr" | "rtl";
}

function formatText(value: FieldValue): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function formatEnum(value: string | null | undefined): string {
  if (!value) return "-";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "MMM d, yyyy");
}

function fieldList(items: FieldItem[]) {
  return (
    <div className="grid grid-cols-1 gap-y-4 gap-x-8 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
            {item.label}
          </p>
          <p
            className="break-words text-sm text-foreground"
            dir={item.dir ?? "ltr"}
          >
            {formatText(item.value)}
          </p>
        </div>
      ))}
    </div>
  );
}

function fullArabicName(staff: LegacyStaffSnapshotStaff) {
  return [staff.firstNameAr, staff.middleNameAr, staff.lastNameAr]
    .filter(Boolean)
    .join(" ");
}

export function LegacyStaffSnapshot({ role, staff }: LegacyStaffSnapshotProps) {
  const address = staff.addresses[0] ?? null;
  const languages = staff.languages ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legacy Account</CardTitle>
        </CardHeader>
        <CardContent>
          {fieldList([
            { label: "Role", value: role },
            { label: "Legacy ID", value: staff.legacyId },
            { label: "Legacy Table", value: staff.legacyTable },
            { label: "Source Database", value: staff.sourceDatabase },
            { label: "Legacy Key", value: staff.legacyKey },
            { label: "Username", value: staff.username },
            { label: "Legacy User ID", value: staff.legacyUserId },
            { label: "Linked User", value: staff.userId ? "Yes" : null },
          ])}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">General Infos</CardTitle>
        </CardHeader>
        <CardContent>
          {fieldList([
            { label: "First Name", value: staff.firstName },
            { label: "Middle Name", value: staff.middleName },
            { label: "Last Name", value: staff.lastName },
            {
              label: "Arabic Name",
              value: fullArabicName(staff),
              dir: "rtl",
            },
            { label: "Date of Birth", value: formatDate(staff.dateOfBirth) },
            { label: "Place of Birth", value: staff.placeOfBirth },
            { label: "Register Number", value: staff.registerNumber },
            { label: "License Number", value: staff.licenseNumber },
            { label: "Nationality", value: staff.nationality },
            { label: "Marital Status", value: formatEnum(staff.maritalStatus) },
            { label: "Number of Children", value: staff.numberOfChildren },
            { label: "Gender", value: formatEnum(staff.gender) },
            { label: "Medical Case", value: staff.medicalCase },
            {
              label: "Medical Case Description",
              value: staff.medicalCaseDescription,
            },
          ])}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact And Address</CardTitle>
        </CardHeader>
        <CardContent>
          {fieldList([
            { label: "Telephone", value: staff.telephone },
            { label: "Mobile", value: staff.mobile },
            { label: "Phone", value: staff.phone },
            { label: "Email", value: staff.email },
            { label: "Mouhafaza", value: address?.governorate },
            { label: "Quadaa", value: address?.district },
            { label: "Region", value: address?.region },
            { label: "City", value: address?.city },
            { label: "Street", value: address?.street },
            { label: "Building", value: address?.building },
          ])}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Education And Placement</CardTitle>
        </CardHeader>
        <CardContent>
          {fieldList([
            { label: "Secondary Degree", value: staff.secondaryDegree },
            { label: "Secondary Degree Year", value: staff.secondaryDegreeYear },
            { label: "University Degree", value: staff.universityDegree },
            { label: "University Degree Year", value: staff.universityDegreeYear },
            { label: "Specialization", value: staff.specialization },
            { label: "CNSS", value: staff.cnss },
            { label: "CNSS Number", value: staff.cnssNo },
            { label: "Branch", value: staff.branch.name },
            { label: "Class", value: staff.class?.name },
            { label: "Hire Date", value: formatDate(staff.hireDate) },
            { label: "Active", value: staff.isActive },
            { label: "Remarks", value: staff.remarks },
          ])}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Languages</CardTitle>
        </CardHeader>
        <CardContent>
          {languages.length > 0 ? (
            <div className="divide-y rounded-md border">
              {languages.map((language) => (
                <div
                  key={language.id}
                  className="grid grid-cols-1 gap-3 p-3 text-sm sm:grid-cols-4"
                >
                  <div className="font-medium">{formatEnum(language.language)}</div>
                  <div className="text-muted-foreground">
                    Read: {formatEnum(language.canRead)}
                  </div>
                  <div className="text-muted-foreground">
                    Write: {formatEnum(language.canWrite)}
                  </div>
                  <div className="text-muted-foreground">
                    Speak: {formatEnum(language.canSpeak)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No languages recorded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
